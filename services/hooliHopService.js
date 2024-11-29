const axios = require('axios');
const countArrayElementsInObject = require('../utilities/bestCoincidence')
const isCopyExistInArray = require('../utilities/existDuplicate');
const getCurrentDate = require('../utilities/currentDate');
const defineLastThemes = require('../utilities/defineLastThemes');
const calculateAge = require('../utilities/defineAge');
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
                    }
                }
            );
            // Группы с подходящей дисциплиной и уровнем
            const possibleGroups = response.data.EdUnits;
            if (!possibleGroups.length) return []
            const possibleGroupId = possibleGroups.filter(group => group.StudentsCount < process.env.MAX_STUDENTS_IN_GROUP).map(group => group.Id)
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
            const studentsByIdGroupResponse = await Promise.all(getStudentsByIdGroupPromises)
            // Находим студентов в группе
            const studentsByIdGroup = studentsByIdGroupResponse.map(response => response.data.EdUnitStudents)
            // Определяем последние темы групп по студентам в них
            const lastThemes = studentsByIdGroup.map(defineLastThemes).map(courses => courses[discipline])
            // Проверить это место
            console.log(studentsByIdGroup)
            console.log(lastThemes)
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
            const studentsIdFromAppropriateGroups = studentsFromAppropriateGroups.map(response => response.data.EdUnitStudents.map(student => student.StudentClientId))
            const studentsDataFromAppropriateGroupsResponses = await Promise.all(
                studentsIdFromAppropriateGroups.flat().map(
                    studentId => axiosInstance.get(
                        "GetStudents",
                        {
                            params: {
                                clientId: studentId,
                            }
                        }
                    )
                )
            )
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

