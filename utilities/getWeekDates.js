// Функция используется для формирования таблицы Zoom-ов, возвращает список дней текущей недели

function getWeekDates() {
    const today = new Date(); // текущая дата
    const dayOfWeek = today.getDay(); // день недели (0 - воскресенье, 1 - понедельник и т.д.)

    // Считаем сколько дней нужно вычесть, чтобы получить понедельник
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    today.setDate(today.getDate() - daysToMonday); // устанавливаем дату на понедельник текущей недели

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i); // прибавляем дни, чтобы получить остальные дни недели
        const day = String(date.getDate()).padStart(2, '0'); // день месяца с ведущим нулём
        const month = String(date.getMonth() + 1).padStart(2, '0'); // месяц с ведущим нулём
        const year = date.getFullYear(); // год
        weekDates.push(`${year}-${month}-${day}`); // добавляем дату в формат "dd-mm-yyyy"
    }

    return weekDates;
}

module.exports = getWeekDates;