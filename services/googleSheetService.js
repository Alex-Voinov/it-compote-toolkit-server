const axios = require('axios');
const csvToArrayOfObjects = require('../utilities/csvToArrayOfObjects');
require('dotenv').config();

const { google } = require('googleapis');
const credentials = require('../googleSheetKey.json'); // Укажите путь к JSON-файлу
// Аутентификация
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });

const googleGidData = [
    {
        gid: 0,
        title: 'Информатика Junior (Scratch компьютерная грамотность)',
    },
    {
        gid: 1134158828,
        title: 'Scratch математика',
    },
    {
        gid: 1756260387,
        title: 'Город программистов',
    },
    {
        gid: 903653536,
        title: 'Город программистов Джуниор',
    },
    {
        gid: 1344626620,
        title: 'Python GameDev (Разработка 2D-игр 1 ступень)',
    },
    {
        gid: 1786651336,
        title: 'Python GameDev (Разработка 2D и 3D-игр 2 ступень)',
    },
    {
        gid: 644508222,
        title: 'Программирование Python не игры',
    },
    {
        gid: 777535457,
        title: 'Web-программирование (1 ступень frontend)',
    },
    {
        gid: 439500914,
        title: 'Web-программирование (2 ступень backend)',
    },
    {
        gid: 1702003797,
        title: 'Графический дизайн',
    },
    {
        gid: 1012441125,
        title: 'Web-дизайн',
    },
    {
        gid: 628110729,
        title: '3D-моделирование (Blender)',
    },
    {
        gid: 492897619,
        title: ' 3D-моделирование 2 год',
    },
]

class GoogleSheetService {
    getTopicsAcrossDisciplines = async () => {
        try {
            const gidRequests = {};
            const promises = googleGidData.map(async data => {
                const { gid, title } = data;
                const SHEET_URL = `${process.env.GOOGLE_SHEET_URL}/export?format=csv&gid=${gid}`;

                try {
                    const response = await axios.get(SHEET_URL);
                    const allTable = await csvToArrayOfObjects(response.data);
                    gidRequests[title] = allTable.map(el => el[2]).filter(
                        el => el && !el.toLowerCase().includes('тема для holli hop')
                    )
                } catch (error) {
                    console.error(`Ошибка запроса к таблице ${title} по gid: ${gid}`);
                }
            });

            await Promise.all(promises);
            return gidRequests;

        } catch (error) {
            console.error('Error in GoogleSheetService service (getTopicsAcrossDisciplines):', error.message);
            throw error;
        }
    }
    addRowToSheet = async (data) => {
        try {
            // Добавление строки в конец таблицы
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_FEEDBACK_TEACHER_ID,
                range: 'Лист1', // Укажите название листа
                valueInputOption: 'RAW', // RAW — данные без автоформатирования, USER_ENTERED — с автоформатированием
                resource: {
                    values: [data], // Данные, которые нужно добавить (одномерный массив)
                },
            });
            return response.data.updates.updatedRange;
        } catch (error) {
            console.error('Ошибка при добавлении строки:', error);
            throw error;
        }
    }
    updateActivityTable = async (rows) => {
        try {
            const titles = [
                'Cсылка на группу',
                'Дисциплина',
                'Дата занятия',
                'Время начала занятия',
                'День недели',
                'Группа',
                'Ученик',
                'Тип',
                'Комната',
            ]
            const sheetName = 'Лист1'; // Название листа
            const spreadsheetId = process.env.GOOGLE_SHEET_ZOOM_LESSONS;

            // Очищаем таблицу, начиная с первой строки до 10000
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${sheetName}!1:10000` // Указание диапазона
            });

            // Формируем данные для записи (сохраняем первую строку и добавляем новые строки)
            const updatedData = [titles, ...rows];

            // Записываем данные в таблицу
            const response = await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A1`, // Указываем начало диапазона
                valueInputOption: 'RAW', // RAW — данные без автоформатирования
                resource: {
                    values: updatedData // Передаём массив данных
                }
            });

            return response.data.updatedRange;
        } catch (error) {
            console.error('Ошибка при обновлении таблицы:', error);
            throw error;
        }
    }
}
module.exports = new GoogleSheetService();