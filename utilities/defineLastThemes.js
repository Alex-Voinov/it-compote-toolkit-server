require('dotenv').config();

const defineLastThemes = (coursesData, checkPass = false) => {
    const formattedCourses = {} // объект, имеющий вид имя курса - последняя пройденная тема
    for (let course of coursesData) {
        const courseName = course.EdUnitDiscipline
        const daysDataNative = course.Days
        if (!daysDataNative.length) continue // Нет дней 
        const daysData = daysDataNative.filter(day => day.Description)
        if (!daysData.length) continue // Нет дней с комментариями
        const lastDayData = daysData.reduce((max, current) => {
            // Преобразуем строки в объекты Date для корректного сравнения
            return (new Date(current.Date) > new Date(max.Date) && (!checkPass || current.Pass)) ? current : max;
        });
        if (lastDayData) {
            if (!(courseName in formattedCourses)) // если о курсе ещё нет информации
                formattedCourses[courseName] = lastDayData
            else if (courseName in formattedCourses && lastDayData.Date > formattedCourses[courseName]) // если есть и она новее предыдущей
                formattedCourses[courseName] = lastDayData
        }
    }
    return formattedCourses;
}

module.exports = defineLastThemes;