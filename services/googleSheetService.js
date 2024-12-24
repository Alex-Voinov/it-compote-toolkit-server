const axios = require('axios');
const csvToArrayOfObjects = require('../utilities/csvToArrayOfObjects');

const { google } = require('googleapis');
const credentials = require('../googleSheetKey.json'); // Укажите путь к JSON-файлу
const googleGidData = require('../utilities/googleGidData');
// Аутентификация
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });


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
                    logger.error(`Ошибка запроса к таблице ${title} по gid: ${gid}`);
                }
            });

            await Promise.all(promises);
            return gidRequests;

        } catch (error) {
            logger.error('Error in GoogleSheetService service (getTopicsAcrossDisciplines):', error.message);
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
            logger.error('Ошибка при добавлении строки:', error);
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
            const sheetName = 'Выгрузка'; // Название листа
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
            logger.error('Ошибка при обновлении таблицы:', error);
            throw error;
        }
    }
}
module.exports = new GoogleSheetService();