const hooliHopService = require("./services/hooliHopService");
const googleSheetService = require("./services/googleSheetService");
const { capitalize } = require('./utilities/strFunc')
const defineLastThemes = require('./utilities/defineLastThemes')

class Controllers {
    async getUser(req, res, next) {
        try {
            const { fullName, email, tel } = req.query;
            if (fullName || email || tel) {
                const informationReceived = [
                    ...(tel ? [tel] : []),
                    ...(email ? [email] : []),
                    ...(fullName ? fullName.split(' ').map(partName => capitalize(partName)) : []),
                ];
                const fundStudnet = await hooliHopService.getStudent(informationReceived);
                return res.status(200).json({
                    status:
                        (!fundStudnet || Array.isArray(fundStudnet) && !fundStudnet.length)
                            ? 'no matches'
                            : (Array.isArray(fundStudnet)
                                ? 'matches found'
                                : 'perfect match'
                            ),
                    studentsData: fundStudnet
                })
            }
            res.status(422)
        } catch (error) {
            console.error(`Ошибка в контроллере getUser: ${error}.`)
        }
    }
    async getDisciplines(req, res, next) {
        try {
            const response = await hooliHopService.getDisciplines()
            if (response.data.Disciplines) return res.status(200).json(response.data)
            return res.status(502)
        } catch (error) {
            console.error(`Ошибка в контроллере getDisciplines: ${error}.`)
        }
    }
    async getLastThems(req, res, next) {
        try {
            const { studentId } = req.query;
            const response = await hooliHopService.getLastThems(studentId)
            const coursesData = response.data.EdUnitStudents
            if (coursesData) {
                return res.status(200).json(defineLastThemes(coursesData, true))
            } else {
                console.log('Данных о курсе не найденно')
            }
            return res.status(502)
        } catch (error) {
            console.error(`Ошибка в контроллере getLastThems: ${error}.`)
        }
    }
    async pickGroup(req, res, next) {
        try {
            const { level, discipline, age, lastTheme } = req.query;
            const response = await hooliHopService.pickGroup(level, discipline, age, lastTheme)
            // if (response.data.Disciplines) return res.status(200).json(response.data)
            // return res.status(502)
        } catch (error) {
            console.error(`Ошибка в контроллере pickGroup: ${error}.`)
        }
    }
    async getTopicsAcrossDisciplines(req, res, next) {
        try {
            const topics = await googleSheetService.getTopicsAcrossDisciplines()
            if (topics) return res.status(200).json(topics)
            return res.status(502)
        } catch (error) {
            console.error(`Ошибка в контроллере getTopicsAcrossDisciplines: ${error}.`)
        }
    }

}
module.exports = new Controllers();