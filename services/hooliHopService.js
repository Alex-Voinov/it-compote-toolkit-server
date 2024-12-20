const axios = require('axios');
const countArrayElementsInObject = require('../utilities/bestCoincidence')
const isCopyExistInArray = require('../utilities/existDuplicate');
const getCurrentDate = require('../utilities/currentDate');
const defineLastThemes = require('../utilities/defineLastThemes');
const calculateAge = require('../utilities/defineAge');
const getWeekDates = require('../utilities/getWeekDates');
const getDayOfWeek = require('../utilities/getDayOfWeek');
require('dotenv').config();


const axiosInstance = axios.create({
    baseURL: `${process.env.HOOLI_HOP_API_URL}/Api/V2/`,
    params: {
        'authkey': process.env.HOOLI_HOP_API_KEY
    },
});


class HooliHopService {
    getStudent = async (studentData) => {
        try {
            const maximumMatchScore = studentData.length
            let bestMatchScore = 0
            let bestCoincidence = null;
            let perfectMatchs = []
            for (let searchField of studentData) {
                const posibleResponse = await axiosInstance.get(
                    "GetStudents",
                    {
                        params: {
                            term: searchField
                        }
                    }
                )
                const possibleOption = posibleResponse.data.Students;
                if (possibleOption) {
                    for (let possibleStudent of possibleOption) {
                        const currentCoincidence = countArrayElementsInObject(studentData, possibleStudent);
                        if (currentCoincidence === maximumMatchScore) {
                            if (perfectMatchs && !isCopyExistInArray(perfectMatchs, possibleStudent))
                                perfectMatchs.push(possibleStudent)
                        }
                        else if (currentCoincidence > bestMatchScore) {
                            bestMatchScore = currentCoincidence
                            bestCoincidence = [possibleStudent]
                        } else if (currentCoincidence > 0 && currentCoincidence === bestMatchScore) {
                            if (!isCopyExistInArray(bestCoincidence, possibleStudent))
                                bestCoincidence.push(possibleStudent)
                        }
                    }
                    if (perfectMatchs.length === 1) return perfectMatchs[0]
                    else if (perfectMatchs) return perfectMatchs
                }
            }
            return bestCoincidence;
        } catch (error) {
            console.error('Error in Hooli-Hop service (getStudent):', error.message);
            throw error;
        }
    }
    getDisciplines = async () => {
        try {
            return await axiosInstance.get("GetDisciplines");
        } catch (error) {
            console.error('Error in Hooli-Hop service (getDisciplines):', error.message);
            throw error;
        }
    }

    getTeacher = async (email) => {
        try {
            return await axiosInstance.get(
                "GetTeachers",
                {
                    params: {
                        term: email
                    }
                }
            );
        } catch (error) {
            console.error('Error in Hooli-Hop service (getTeacher):', error.message);
            throw error;
        }
    }

    getLastThems = async (
        studentId
    ) => {
        try {
            return await axiosInstance.get(
                "GetEdUnitStudents",
                {
                    params: {
                        studentClientId: studentId,
                        queryDays: 'true',
                        dateFrom: process.env.LESSON_TOPIC_COMMENT_START_DATE,
                        dateTo: getCurrentDate()
                    }
                }
            );
        } catch (error) {
            console.error('Error in Hooli-Hop service (getLastThems):', error.message);
            throw error;
        }
    }

    getActivitiesForTeacherWithoutThemes = async (
        teacherId
    ) => {
        try {
            const activitiesTeacher = await axiosInstance.get(
                "GetEdUnits",
                {
                    params: {
                        teacherId,
                        dateFrom: process.env.START_DATE_FOR_SEARCH,
                        queryDays: 'true',
                        dateTo: getCurrentDate()
                    }
                }
            );
            const posibleLessons = activitiesTeacher.data.EdUnits;
            if (!posibleLessons) return []
            const posibleLessonsWithDay = posibleLessons.filter(lesson => lesson.Days.length > 0) // Оставляем только уроки с информацией о днях
            const posibleLessonsFormated = posibleLessonsWithDay.map(lesson => {
                return {
                    Id: lesson.Id,
                    Type: lesson.Type,
                    Name: lesson.Name,
                    Discipline: lesson.Discipline,
                    Days: lesson.Days.filter(
                        day => !day.Description || day.Description.length === 0
                    ).map(
                        day => {
                            return {
                                Date: day.Date,
                                Description: day.Date
                            }
                        })
                }
            }).filter(
                lesson => lesson.Days.length
            ) // оставляем уроки, по которым нет описания в удобнов формате
            // На этом этапе у нас есть убдобный объект активносетей, но без учеников
            const studentsByGroupsRequests = posibleLessonsFormated.filter(group => group.Type === 'Group').map(group => this.getStudentsByIdGroup(group.Id));
            const studentsByGroups = (await Promise.all(studentsByGroupsRequests)).map(
                res => res.data.EdUnitStudents.map(
                    studentData => {
                        return {
                            Id: studentData.StudentClientId,
                            Name: studentData.StudentName,
                        }
                    }
                ).reduce((obj, item) => {
                    obj[item.Id] = item.Name;
                    return obj;
                }, {})
            ) // Массив, каждый объект которого представляет группу: ключи CloientId Студентов, значения - их ФИО.

            const finallyData = posibleLessonsFormated.map(activity => {
                if (activity.Type === 'Group') {
                    const students = studentsByGroups.shift() // Берем данных об учениках группы
                    return { ...activity, Students: students }
                }
                return activity
            })
            return finallyData
        } catch (error) {
            console.error('Error in Hooli-Hop service (getActivitiesForTeacherWithoutThemes):', error.message);
            throw error;
        }
    }

    getStudentsByIdGroup = async (groupId) => {
        try {
            return axiosInstance.get(
                "GetEdUnitStudents",
                {
                    params: {
                        edUnitId: groupId,
                        queryDays: true,
                        edUnitTypes: 'Group',
                        dateFrom: "2000-01-01",
                        dateTo: "3000-01-01"
                    }
                }
            );
        } catch (error) {
            console.error('Error in Hooli-Hop service (getStudentsByIdGroup):', error.message);
            throw error;
        }
    }
    addThemesByDataActivities = async (
        activityId,
        theme,
        date,
        individulComments
    ) => {
        try {
            // Для групповыз занятий
            const requestsForAddedCommenst = []
            for (let studentId in individulComments) {
                const comment = individulComments[studentId] || ''
                const finallyDescription = `*${theme}\n*\n*${comment}`
                if (activityId && activityId != null && activityId != undefined && activityId != '') {
                    console.log({
                        Date: date,
                        EdUnitId: activityId,
                        StudentClientId: studentId,
                        Description: finallyDescription
                    })
                    requestsForAddedCommenst.push(
                        axiosInstance.post(
                            "SetStudentPasses",
                            {
                                Date: date,
                                EdUnitId: activityId,
                                StudentClientId: studentId,
                                Description: finallyDescription
                            }
                        ).catch(error => {
                            console.error('Ошибка:', error.response ? error.response.data : error.message);
                        })
                    )
                }
            };
            await Promise.all(requestsForAddedCommenst);
        } catch (error) {
            console.error('Error in Hooli-Hop service (addThemesByDataActivities):', error.message);
            throw error;
        }
    }

    getAllActivitiesForZoomTable = async () => {
        try {
            // Софрмировать список дат, по которым нужно получить активности
            const mondayNumber = 0;
            const sundayNumber = 6;
            const dateList = getWeekDates();
            const hhResponse = await axiosInstance.get(
                "GetEdUnitStudents",
                {
                    params: {
                        dateFrom: dateList[mondayNumber],
                        dateTo: dateList[sundayNumber],
                        take: 10000, // Максимальный лимит, в будущем, возможно, стоит увеличить
                        queryDays: true // Для получения точных дат занятий
                    }
                }
            );
            if (!hhResponse || !hhResponse.data || !hhResponse.data.EdUnitStudents) throw new Error('No response from Holihop');
            const activities = hhResponse.data.EdUnitStudents;
            if (activities.length === 0) throw new Error('No response from Holihop');
            const rows = [] // Массив, в котором будут накапливаться строк с данными для таблицы
            // Получаем данные о студентах из групп, для будущего получения их имени
            for (let activity of activities) {
                // Тип активности
                const typeActivitie = activity.EdUnitType;
                // Zoom, в котором проводится занятие
                const room = activity.EdUnitOfficeOrCompanyName
                // Дисциплина 
                const discipline = activity.EdUnitDiscipline
                // Название занятия 
                const name = activity.EdUnitName
                const activityId = activity.EdUnitId
                // Ссылка на занятие, формируется из patern + type + id
                const link = `https://it-school.t8s.ru/Learner/${typeActivitie}/${activityId}`
                // Время начала занятия
                const statrTime = activity.BeginTime
                // Даты, в которых активность проходила на этой неделе
                const days = activity.Days.map(day => day.Date)
                // Строка данных для вставкеи в гугл таблицу
                if (days.length === 0) {
                    console.log(`Активность ${activityId} не имеет данных о днях`)
                    continue;
                }
                for (let day of days) {
                    const dayOfWeek = getDayOfWeek(day)
                    const student = typeActivitie === 'Group' ? activity.StudentName : name
                    const rowForSheet = [
                        link,           // ссылка на группу
                        discipline,     // дисциплина
                        day,            // дата занятия
                        statrTime,      // время начала занятия
                        dayOfWeek,      // день недели
                        name,           // группа
                        student,        // ученик
                        typeActivitie,  // тип
                        room,           // комната
                    ]
                    rows.push(rowForSheet)
                }
            }
            return rows;
        } catch (error) {
            console.error('Error in Hooli-Hop service (getAllActivitiesForZoomTable):', error.message);
            throw error;
        }
    }

    pickGroup = async (
        level,
        discipline,
        age,
        lastTheme
    ) => {
        try {
            const response = await axiosInstance.get(
                "GetEdUnits",
                {
                    params: {
                        types: 'Group',
                        disciplines: discipline,
                        levels: level,
                        dateFrom: process.env.START_DATE_FOR_SEARCH
                    }
                }
            );

            // Группы с подходящей дисциплиной и уровнем
            const possibleGroups = response.data.EdUnits;
            if (!possibleGroups.length) return []
            const possibleGroupId = possibleGroups.filter(group => group.StudentsCount < process.env.MAX_STUDENTS_IN_GROUP).map(group => group.Id)
            let studentsByIdGroupResponse = [];
            const lazyReq = possibleGroupId.length > 500
            if (lazyReq) {
                const amountBigStep = Math.ceil(possibleGroupId.length / 20)
                for (let numberStep = 0; numberStep < amountBigStep; numberStep++) {
                    const comleteRequests = numberStep * 20;
                    const bufferForRequest = []
                    for (let step = 0; step < 20; step++) {
                        const currentStep = comleteRequests + step;
                        if (currentStep === possibleGroupId.length) break;
                        bufferForRequest.push(
                            axiosInstance.get(
                                "GetEdUnitStudents",
                                {
                                    params: {
                                        edUnitId: possibleGroupId[currentStep],
                                        queryDays: true,
                                        dateFrom: "2000-01-01",
                                        dateTo: "3000-01-01"
                                    }
                                }
                            )
                        )
                    }
                    const bufferResponses = await Promise.all(bufferForRequest)
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500))
                    studentsByIdGroupResponse.push(...bufferResponses)
                }
            }
            else {
                const getStudentsByIdGroupPromises = possibleGroupId.map(groupId => {
                    return axiosInstance.get(
                        "GetEdUnitStudents",
                        {
                            params: {
                                edUnitId: groupId,
                                queryDays: true,
                                dateFrom: "2000-01-01",
                                dateTo: "3000-01-01"
                            }
                        }
                    );
                })
                studentsByIdGroupResponse = await Promise.all(getStudentsByIdGroupPromises)
            }
            if (lazyReq) await new Promise(resolve => setTimeout(resolve, Math.random() * 2500 + 5000))
            // Находим студентов в группе
            const studentsByIdGroup = studentsByIdGroupResponse.map(response => response.data.EdUnitStudents)
            // Определяем последние темы групп по студентам в них
            const lastThemes = studentsByIdGroup.map(defineLastThemes).map(courses => courses[discipline])
            const groupIdToLastTheme = Object.assign(
                {},
                ...studentsByIdGroup.map(  // Перебираем группы
                    (group, index) => {
                        return lastThemes[index] // Берем их темы
                            ? {
                                [possibleGroupId[index]]
                                    : lastThemes[index].Description // Формируем объект группы - индекс
                            } : null
                    }
                ).filter(record => record !== null))

            // Проверка на подходящие темы
            for (let groupId in groupIdToLastTheme) {
                const currentTheme = groupIdToLastTheme[groupId]
                let hasCoincidence = false;
                for (let possibleTheme of lastTheme) {
                    if (possibleTheme.includes(currentTheme) || currentTheme.includes(possibleTheme)) {
                        hasCoincidence = true;
                        break;
                    }
                }
                if (!hasCoincidence) delete groupIdToLastTheme[groupId]
            }
            // Проверка на возраст
            const groupsWthSuitableThemes = Object.keys(groupIdToLastTheme) // Id подохдящих групп
            // Запросы на получение студентов из групп
            const lazyStudentReq = groupsWthSuitableThemes.length > 200
            if (lazyStudentReq) await new Promise(resolve => setTimeout(resolve, Math.random() * 2500 + 5000))
            const studentsFromAppropriateGroupsResponses = groupsWthSuitableThemes.map(
                groupId => {
                    return axiosInstance.get("GetEdUnitStudents", {
                        params: {
                            edUnitId: groupId
                        }
                    })
                }
            )
            const studentsFromAppropriateGroups = await Promise.all(studentsFromAppropriateGroupsResponses)
            // Массивы группы - в них массив ID учеников
            const studentsIdFromAppropriateGroups = studentsFromAppropriateGroups.map(
                response => response.data.EdUnitStudents.map(
                    student => student.StudentClientId
                )
            )
            let studentsDataFromAppropriateGroupsResponses = []
            if (lazyReq) {
                let buffer = []
                for (let studentID of studentsIdFromAppropriateGroups.flat()) {
                    buffer.push(studentID)
                    if (buffer.length === 5) {
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500))
                        studentsDataFromAppropriateGroupsResponses.push(
                            ... (await Promise.all(
                                buffer.map(
                                    studentId => {
                                        return axiosInstance.get(
                                            "GetStudents",
                                            {
                                                params: {
                                                    clientId: studentId,
                                                }
                                            }
                                        )
                                    }
                                )
                            ))
                        )
                        buffer = []
                    }
                }
                if (buffer.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500))
                    studentsDataFromAppropriateGroupsResponses.push(
                        ...(await Promise.all(
                            buffer.map(
                                studentId => {
                                    return axiosInstance.get(
                                        "GetStudents",
                                        {
                                            params: {
                                                clientId: studentId,
                                            }
                                        }
                                    )
                                }
                            )
                        ))
                    )
                    buffer = []
                }
            }
            else {
                studentsDataFromAppropriateGroupsResponses = await Promise.all(
                    studentsIdFromAppropriateGroups.flat().map(
                        studentId => {
                            return axiosInstance.get(
                                "GetStudents",
                                {
                                    params: {
                                        clientId: studentId,
                                    }
                                }
                            )
                        }
                    )
                )
            }
            // Формируем объект StudentID - age
            const studentsDataFromAppropriateGroupsBD = Object.assign({}, ...studentsDataFromAppropriateGroupsResponses.map(
                response => {
                    const student = response.data.Students[0]
                    return { [student.ClientId]: calculateAge(student.Birthday) }
                }))
            // Формируем объект GroupID - подходящий overage
            const groupIdToOverAge = Object.assign({}, ...studentsIdFromAppropriateGroups.map((setIdsForGroup, index) => {
                let totalAge = 0
                for (let studentsId of setIdsForGroup) {
                    totalAge += studentsDataFromAppropriateGroupsBD[studentsId]
                }
                const overAge = Math.round(totalAge / setIdsForGroup.length)
                if (Math.abs(overAge - age) <= process.env.DELTA_AGE)
                    return { [groupsWthSuitableThemes[index]]: overAge }
                return null
            }).filter(data => data !== null))
            const suitableGroups = []
            for (let groupId in groupIdToOverAge) {
                const lastTheme = groupIdToLastTheme[groupId];
                const overAge = groupIdToOverAge[groupId]
                suitableGroups.push(
                    {
                        groupId,
                        overAge,
                        lastTheme
                    }
                )
            }
            return suitableGroups
        } catch (error) {
            console.error('Error in Hooli-Hop service (pickGroup):', error.message);
            throw error;
        }
    }
}

module.exports = new HooliHopService();

