const axios = require('axios');
const csvToArrayOfObjects = require('../utilities/csvToArrayOfObjects');
require('dotenv').config();


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
}
module.exports = new GoogleSheetService();