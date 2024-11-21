const axios = require('axios');
const countArrayElementsInObject = require('../utilities/bestCoincidence')
const isCopyExistInArray = require('../utilities/existDuplicate')
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
}

module.exports = new HooliHopService();

