require('dotenv').config();


// Функция, создающая из всех дисциплин ученика объект 
// дисциплина - последняя тема по ней
const defineLastThemes = (coursesData, checkPass = false) => {
    const dataFromGroup = coursesData.filter(action => action.EdUnitType === 'Group') // Оставляем только групповые уроки
    if (!dataFromGroup.length) return {}
    const formattedCourses = {}                     // объект, который мы будем формировать для ответа
    for (let course of dataFromGroup) {             // Перебираем групповые активности
        const courseName = course.EdUnitDiscipline  // получаем название дисциплины
        const daysDataNative = course.Days          // смотрим информацию по дням о ней, тема записывается в дне 
        if (!daysDataNative.length) continue        // если нет информации о днях, сразу идем дальше 
        // Оставляем только дни с полем Description, в нем тема
        // Если функция вызвана с параметром првоерки пропусков checkPass = true, будут также убраны дни где current.Pass == false
        const daysData = daysDataNative.filter(day => day.Description && (!checkPass || !day.Pass))
        if (!daysData.length) continue // Если таких нет, сразу идем дальше, тему не определить
        let lastDay = null;
        for (let day of daysData) {
            if (!lastDay || new Date(day.Date) > new Date(lastDay.Date)) lastDay = day
        }
        if (!(courseName in formattedCourses)) // если о курсе ещё нет информации
            formattedCourses[courseName] = lastDay
        else if (courseName in formattedCourses && (new Date(lastDay.Date) > new Date(formattedCourses[courseName].Date))) // если есть и она новее предыдущей
            formattedCourses[courseName] = lastDay
    }
    return formattedCourses;
}

module.exports = defineLastThemes;