const axios = require('axios');
const logger = require('../logger');
const countArrayElementsInObject = require('../utilities/bestCoincidence')
const isCopyExistInArray = require('../utilities/existDuplicate');
const getCurrentDate = require('../utilities/currentDate');
const defineLastThemes = require('../utilities/defineLastThemes');
const calculateAge = require('../utilities/defineAge');
const getWeekDates = require('../utilities/getWeekDates');
const getDayOfWeek = require('../utilities/getDayOfWeek');
const compareDatesOnly = require('../utilities/compTime');


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
            logger.error('Error in Hooli-Hop service (getStudent):', error.message);
            throw error;
        }
    }
    getDisciplines = async () => {
        try {
            return await axiosInstance.get("GetDisciplines");
        } catch (error) {
            logger.error('Error in Hooli-Hop service (getDisciplines):', error.message);
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
            logger.error('Error in Hooli-Hop service (getTeacher):', error.message);
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
            logger.error('Error in Hooli-Hop service (getLastThems):', error.message);
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
            const posibleLessons = activitiesTeacher.data.EdUnits; // Активности педагога
            if (!posibleLessons) return []
            const posibleLessonsWithDayIndividual = posibleLessons.filter(
                lesson => lesson.Days.length > 0 && lesson.Type === 'Individual'
            ) // Оставляем только индивидуальные активности с информацией о днях
            const posibleLessonsWithDayGroup = posibleLessons.filter(lesson => lesson.Type === 'Group') // Получили группы, теперь нужно залезть в учеников в них
            
            const studentInPosibleLessonsWithDayGroupResponse = await Promise.all(
                posibleLessonsWithDayGroup.map(
                    group => this.getStudentsByIdGroup(group.Id)
                )
            ) // Студенты в группах педагога
            const studentInPosibleLessonsWithDayGroup = studentInPosibleLessonsWithDayGroupResponse.map(res => res.data.EdUnitStudents)
            const accGroupDayWithoutThemes = []
            for (let students of studentInPosibleLessonsWithDayGroup) { // Проходимся по ученикам в группе
                if (!Array.isArray(students) || !students.length > 0) continue;
                const setIdNames = students.reduce((acc, student) => {
                    acc[student.StudentClientId] = student.StudentName
                    return acc
                }, {})
                const student = students[0];    // Берем первого попавшегося в группе, првоеряем по нему всю группу, т.к. если группе оставляли комментарии они попали во всех учеников
                const dayWithoutComment = student.Days.filter(                     // Находим дни без комментариев, в прошлом времени
                    day => compareDatesOnly(day.Date)                              // День уже наступил
                        && (!day.Description || day.Description.length === 0)      // Но в нём ещё нет комментария
                        && !(day.Pass === true && day.TeacherPayableMinutes > 0)   // и он не является оплачиваемым пропуском (Нет пропуска, за который заплачено)
                )
                if (dayWithoutComment.length > 0) accGroupDayWithoutThemes.push({
                    Id: student.EdUnitId,
                    Days: dayWithoutComment.map(day => day.Date),
                    Students: setIdNames,
                    Name: student.EdUnitName,
                    Discipline: student.EdUnitDiscipline,
                    BeginTime: student.BeginTime,
                    EndTime: student.EndTime,
                    Type: 'Group',
                }
                )
            }
            console.log(accGroupDayWithoutThemes)
            // На этом этапе у нас есть accGroupDayWithoutThemes - массив полезной информации по группам, состоящий из объектов, типа:
            //     Id:  29506,                       id группы
            //     Type: 'Group',                    тип группы
            //     Days: [                           дни без комментариев
            //     BeginTime:    '13:50',            время начала занятий
            //     EndTime: '15:30',                 время конца занятий
            //     '2025-01-18', '2025-01-25',        
            //     '2025-02-01', '2025-02-08',
            //     '2025-02-15', '2025-02-22',
            //     '2025-03-01', '2025-03-08',
            //     '2025-03-15', '2025-03-22'
            //     ],
            //     Students: {
            //     '1746': 'Костащук Михаил',
            //     '4158': 'Безе Сергей Игоревич',
            //     '4206': 'Губайдулина Татьяна Юрьевна',
            //     '4370': 'Тетерина Александра Михайловна'
            //     },
            //     Name: 'WEB-2-GROUP сайт магазина',
            //     Discipline: 'Web-программирование (2 ступень backend)'
            // }

            // Теперь формируем такой же массив по индивидуальным урокам
            const posibleLessonsFormated = posibleLessonsWithDayIndividual.map(lesson => {
                const ScheduleItems = lesson.ScheduleItems // Схема уроков, в ней находятся элементы расписания
                const hasSchedule = ScheduleItems && Array.isArray(ScheduleItems) && ScheduleItems[0] // Есть ли нужный нам элемент расписания
                return {
                    Type: 'Individual',
                    Id: lesson.Id,
                    Name: lesson.Name,
                    Discipline: lesson.Discipline,
                    BeginTime: hasSchedule ? ScheduleItems[0].BeginTime : '-',
                    EndTime: hasSchedule ? ScheduleItems[0].EndTime : '-',
                    Days: lesson.Days.filter(
                        day => compareDatesOnly(day.Date)                                 // День уже наступил
                            && (!day.Description || day.Description.length === 0)         // Но в нём ещё нет комментария
                            //&& !(day.Pass === false && day.TeacherPayableMinutes > 0)   // и он не является оплачиваемым пропуском (Нет пропуска, за который заплачено)
                            && day.Pass === false                                         // Пропуски не должны попадать 
                        ).map(day => day.Date)
                }
            }).filter(
                lesson => lesson.Days.length
            ) // Оставляем индивидуальные уроки, по которым нет описания. В удобном формате


            const clientsByIndividualLessonsRequest = posibleLessonsFormated.map(
                lesson => axiosInstance.get(
                    "GetEdUnitStudents",
                    {
                        params: {
                            edUnitId: lesson.Id,
                            edUnitTypes: 'Individual',
                            dateFrom: process.env.START_DATE_FOR_SEARCH,
                            dateTo: getCurrentDate()
                        }
                    }
                )
            );
            const clientsByIndividualLessons = (await Promise.all(clientsByIndividualLessonsRequest)).map(res => {
                const results = res.data.EdUnitStudents
                if (!(results && results.length > 0)) return;
                const findStudent = results[0]
                return {
                    [findStudent.EdUnitId]: {
                        [findStudent.StudentClientId]: findStudent.StudentName
                    }
                }
            }).reduce((acc, obj) => {
                const [key, value] = Object.entries(obj)[0];
                acc[key] = value;
                return acc;
            }, {});

            const posibleLessonsFormatedWithClientID = posibleLessonsFormated.map(les => { return { ...les, Students: clientsByIndividualLessons[les.Id] } })

            const finallyData = [...accGroupDayWithoutThemes, ...posibleLessonsFormatedWithClientID,]

            return finallyData
        } catch (error) {
            logger.error('Error in Hooli-Hop service (getActivitiesForTeacherWithoutThemes):', error.message);
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
            logger.error('Error in Hooli-Hop service (getStudentsByIdGroup):', error.message);
            throw error;
        }
    }
    addThemesByDataActivities = async (
        activityId,
        theme,
        date,
        individulComments,
        attendance
    ) => {
        try {
            // Для групповыз занятий
            // Преобразуем объект комментариев в массив параметров
            const data = Object.entries(individulComments).map(([studentId, comment]) => ({
                Date: date,
                EdUnitId: activityId,
                StudentClientId: studentId,
                Description: `*${theme}\n*\n*${comment}`,
                pass: Object.keys(attendance).length > 0? studentId in attendance ? !(studentId in attendance) : true: false,
            }))

            const response = await axiosInstance.post(
                "SetStudentPasses",
                data,
                {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                }
            );
        } catch (error) {
            if (error.response) {
                // Сервер ответил с кодом ошибки
                logger.error("Ошибка сервера:", error.response.status);
                logger.error("Ответ от сервера:", error.response.data);
            } else if (error.request) {
                // Запрос был сделан, но не получен ответ
                logger.error("Ошибка запроса:", error.request);
            } else {
                // Произошла ошибка при настройке запроса
                logger.error("Ошибка настройки запроса:", error.message);
            }
            logger.error('Error in Hooli-Hop service (addThemesByDataActivities):', error.message);
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
                    logger.info(`Активность ${activityId} не имеет данных о днях`)
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
            logger.error('Error in Hooli-Hop service (getAllActivitiesForZoomTable):', error.message);
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
            // По каждой группе надо отправить запрос, если их больше 500 хх воспринимает это как дудос
            // Поэтому начинаем отправлять запросы, через определенные интервалы времени
            // Делаем по 20 запросов за 0.5 - 1 секунду
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
            // Обычная загрузка
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

            // Дополнительно попросили добавить даты занятий, следующие пару строчек получают данные о времени
            const possibleGroupRequests = []
            const mondayNumber = 0;
            const sundayNumber = 6;
            const dateList = getWeekDates();

            for (let groupId in groupIdToOverAge) possibleGroupRequests.push(
                axiosInstance.get("GetEdUnitStudents", {
                    params: {
                        edUnitId: groupId,
                        dateFrom: dateList[mondayNumber],
                        dateTo: dateList[sundayNumber],
                        queryDays: true,
                    }
                })
            )
            const overagePossibleGroups = await Promise.all(possibleGroupRequests);
            const formatedGroupForDateTime = {}
            for (let possibleGroup of overagePossibleGroups) {
                const groupData = possibleGroup.data.EdUnitStudents[0]
                const days = groupData.Days.map(day => day.Date)
                if (!groupData || !days) continue
                formatedGroupForDateTime[groupData.EdUnitId] = {
                    startTime: groupData.BeginTime,
                    weekday: days,
                    weekdaysName: days.map(getDayOfWeek)
                }
            }
            // цикл сверху сформировал formatedGroupForDateTime
            // Пример:
            // {
            //     '32037': {
            //         startTime: '12:40',
            //             weekday: ['2024-12-22'],
            //                 weekdaysName: ['воскресенье']
            //     }
            // }
            for (let groupId in groupIdToOverAge) {
                const lastTheme = groupIdToLastTheme[groupId];
                const overAge = groupIdToOverAge[groupId]
                const datetime = formatedGroupForDateTime[groupId]
                suitableGroups.push(
                    {
                        groupId,
                        overAge,
                        lastTheme,
                        ...(datetime ? datetime : {})
                    }
                )
            }
            return suitableGroups
        } catch (error) {
            logger.error('Error in Hooli-Hop service (pickGroup):', error.message);
            throw error;
        }
    }
}

module.exports = new HooliHopService();

