const hooliHopService = require("./services/hooliHopService");
const googleSheetService = require("./services/googleSheetService");
const amoService = require("./services/amoService");
const { capitalize } = require('./utilities/strFunc')
const defineLastThemes = require('./utilities/defineLastThemes')
const formatDate = require('./utilities/datePerfectView');
const logger = require("./logger");
const lessonTopics  = require("./stores/lessonTopics");
const payments  = require("./stores/payments");


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
            logger.error(`Ошибка в контроллере getUser: ${error}.`)
        }
    }
    async getDisciplines(req, res, next) {
        try {
            const response = await hooliHopService.getDisciplines()
            if (response.data.Disciplines) return res.status(200).json(response.data)
            return res.status(502)
        } catch (error) {
            logger.error(`Ошибка в контроллере getDisciplines: ${error}.`)
        }
    }

    async getPaymentsData(req, res, next) {
        try {
            const { teacherName } = req.query;
            const paymentsData = await payments.getPayments(teacherName)
            res.status(200).json(paymentsData)
        } catch (error) {
            logger.error(`Ошибка в контроллере getPaymentsData: ${error}.`)
        }
    }

    async getLastThems(req, res, next) {
        try {
            const { studentId } = req.query;
            const response = await hooliHopService.getLastThems(studentId)
            const coursesData = response.data.EdUnitStudents
            if (coursesData) {
                return res.status(200).json(
                    defineLastThemes(coursesData, true)
                )
            } else {
                logger.info('Данных о курсе не найденно')
            }
            return res.status(502)
        } catch (error) {
            logger.error(`Ошибка в контроллере getLastThems: ${error}.`)
        }
    }
    async pickGroup(req, res, next) {
        try {
            const { level, discipline, age, lastTheme } = req.query;
            const suitableGroups = await hooliHopService.pickGroup(level, discipline, age, lastTheme)
            return res.status(200).json({ suitableGroups: suitableGroups })
        } catch (error) {
            logger.error(`Ошибка в контроллере pickGroup: ${error}.`)
            res.status(400).json(error)
        }
    }

    async getTopicsAcrossDisciplines(req, res, next) {
        try {
            const topics = await lessonTopics.getTopics();
            if (topics) return res.status(200).json(topics)
            return res.status(502)
        } catch (error) {
            logger.error(`Ошибка в контроллере getTopicsAcrossDisciplines: ${error}.`)
        }
    }

    async getLatestCall(req, res, next) {
        try {
            const leadId = req.query.id;
            if (!leadId) {
                return res.status(400).json({ error: "Не указан ID сделки" });
            }
            const { status, data } = await amoService.getLatestCall(leadId);
            res.status(status).json(data)
        } catch (error) {
            logger.error(`Ошибка в контроллере getLatestCall: ${error}.`)
            res.status(500).json({ error: "Внутренняя ошибка сервера" });
        }
    }

    async verifyTeacher(req, res, next) {
        try {
            const { email, password } = req.query;
            if (!(email && email.length > 0 && password && password.length > 0)) return res.status(403).json({ message: 'Пустые поля' })
            if (password.trim() !== process.env.TEACHER_CODE) return res.status(404).json({ message: 'Пароль не верен' })
            const HHResponse = await hooliHopService.getTeacher(email);
            const possibleTeachers = HHResponse?.data?.Teachers
            if (!(possibleTeachers && possibleTeachers.length > 0)) return res.status(404).json({ message: 'Преподаватель с указанным email не найден.' })
            res.status(200).json(possibleTeachers[0])
        } catch (error) {
            logger.error(`Ошибка в контроллере verifyTeacher: ${error}.`)
        }
    }

    async getActivitiesForTeacherWithoutThemes(req, res, next) {
        try {
            const { teacherId } = req.query;
            if (!teacherId || teacherId === 'undefined') return res.status(403).send('Нет Id преподавателя')
            const findActivities = await hooliHopService.getActivitiesForTeacherWithoutThemes(teacherId);
            res.status(200).json(findActivities)
        } catch (error) {
            logger.error(`Ошибка в контроллере getActivitiesForTeacherWithoutThemes: ${error}.`)
        }
    }

    async updateActivityTable(req, res, next) {
        try {
            // Запрос на формирование всех активностей в hh
            const allActivities = await hooliHopService.getAllActivitiesForZoomTable();
            if (!allActivities || !allActivities.length) res.status(503).send('Не удалось сформировать список активностей, по данным хх')
            await googleSheetService.updateActivityTable(allActivities)
            res.status(200).send(`Таблица обновлена успешно.
Записей загружено: ${allActivities.length}.
Ссылка для просмотра: https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ZOOM_LESSONS}/`)
        } catch (error) {
            logger.error(`Ошибка в контроллере updateActivityTable: ${error}.`)
            res.status(400).send(error.message ? error.message : 'неизвестная ошибка')
        }
    }

    async fillActivityData(req, res, next) {
        try {
            const {
                activityId,         // Id Активности (Мероприятия), к примеру, уроки по питону
                date,               // День из выбранной активности
                theme,              // Выбраная педагогом тема
                individulComments,  // Объект ClientId студента - комментарий лично к нему, от педагога
                generalComments,    // Основные комментарии об уроке: объекь название комментария - текст комментария
                rates,               // Оценки от 1 до 10: объекь название шкалы - оценка
                lecturer,            // Преподаватель заполневший активность {ClientId, FullName}
                attendance,          // Посещаемость учеников {ClientId, true/false} (если id нет - ученика не было)
            } = req.query;
            if (!activityId || !date || !theme || !generalComments || !rates || !lecturer)
                return res.status(400).send('Неверный формат ввода данных')
            const rowForGoogleSheet = [
                lecturer.FullName,
                activityId,
                date,
                theme,
                rates.satisfaction,
                rates.Feelings,
                rates.FeelingsStudent,
                generalComments.positiveAspects,
                generalComments.growthPoints,
                generalComments.generalQuestions,
                formatDate(new Date()),
            ].map(value => value === undefined || value === '' ? '–' : value)
            const appendRowInGoogleSheetReq = googleSheetService.addRowToSheet(rowForGoogleSheet)
            const editCommentsInHH = hooliHopService.addThemesByDataActivities(
                activityId,
                theme,
                date,
                individulComments,
                attendance
            );
            await Promise.all([appendRowInGoogleSheetReq, editCommentsInHH])
            res.status(200).send('Ok')
        } catch (error) {
            logger.error(`Ошибка в контроллере fillActivityData: ${error}.`)
            res.status(500).send(error)
        }
    }
}
module.exports = new Controllers();