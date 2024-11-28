const axios = require('axios');
const countArrayElementsInObject = require('../utilities/bestCoincidence')
const isCopyExistInArray = require('../utilities/existDuplicate');
const getCurrentDate = require('../utilities/currentDate');
const defineLastThemes = require('../utilities/defineLastThemes');
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
            const studentsByIdGroup = studentsByIdGroupResponse.map(response => response.data.EdUnitStudents)
            const lastThemes = studentsByIdGroup.map(defineLastThemes).map(courses => courses[discipline])
            const groupIdToLastTheme = studentsByIdGroup.map(
                 (group, index) => { return lastThemes[index] ? { [possibleGroupId[index]]: lastThemes[index].Description } : null }
            ).filter(record => record !== null)
            console.log(groupIdToLastTheme)
            //console.log(studentsByIdGroup.map(students => defineLastThemes(students[0])[disciplines]))
            // Проверить её, оставить только подходящие
            // В подходящих по id учеников получить их дни рождеения
            // Посчитать средние значения по группам, отфлитровать не подходящие
            // Вернуть найденные
        } catch (error) {
            console.error('Error in Hooli-Hop service (pickGroup):', error.message);
            throw error;
        }
    }
}

module.exports = new HooliHopService();

