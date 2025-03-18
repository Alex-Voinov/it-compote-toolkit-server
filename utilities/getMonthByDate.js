const monthsRussian = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

function getMonthByDate(dateStr) {
    // Преобразуем строку в объект Date
    const date = new Date(dateStr);

    // Получаем месяц (0-11) и возвращаем его на русском языке
    return monthsRussian[date.getMonth()];
}

module.exports = getMonthByDate;