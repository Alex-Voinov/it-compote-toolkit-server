const Papa = require('papaparse');

// Для тем уроков по дисциплинам
const csvToArrayOfObjects = (csv) => {
    return new Promise((resolve, reject) => {
        Papa.parse(csv, {
            header: false,   // Включаем первую строку как заголовки
            skipEmptyLines: true, // Пропускаем пустые строки
            dynamicTyping: true, // Преобразуем типы данных автоматически
            complete: (result) => {
                resolve(result.data); // Возвращаем результат через resolve
            },
            error: (error) => {
                reject('Error parsing CSV: ' + error.message); // Ожидаем ошибку, если она возникнет
            }
        });
    });
};


module.exports = csvToArrayOfObjects;