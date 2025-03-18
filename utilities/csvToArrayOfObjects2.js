const Papa = require('papaparse');

// Для данных о платежах
const csvToArrayOfObjects2 = (csv, headers) => {
    return new Promise((resolve, reject) => {
        Papa.parse(csv, {
            header: false,   // Указываем, что не будем считать первую строку заголовками
            skipEmptyLines: true, // Пропускаем пустые строки
            dynamicTyping: true, // Преобразуем типы данных автоматически
            complete: (result) => {
                // Преобразуем каждую строку в объект с ключами из headers
                const data = result.data.map(row => {
                    let obj = {};
                    row.forEach((value, index) => {
                        obj[headers[index]] = value; // Преобразуем строку в объект
                    });
                    return obj;
                });
                resolve(data); // Возвращаем результат через resolve
            },
            error: (error) => {
                reject('Error parsing CSV: ' + error.message); // Ошибка парсинга
            }
        });
    });
};


module.exports = csvToArrayOfObjects2;