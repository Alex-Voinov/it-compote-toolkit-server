// Возвращает день, исходя из строки переданной даты
// Используется в формировании zoom таблицы

function getDayOfWeek(dateString) {
    const date = new Date(dateString);
    const daysOfWeek = [
      'воскресенье',
      'понедельник',
      'вторник',
      'среда',
      'четверг',
      'пятница',
      'суббота'
    ];
    return daysOfWeek[date.getDay()];
  }
  
 
  module.exports = getDayOfWeek;
  