const hooliHopService = require("./services/hooliHopService");
const { capitalize } = require('./utilities/strFunc')

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
                console.log(fundStudnet)
                return res.status(200).json({
                    status:
                        (!fundStudnet || Array.isArray(fundStudnet) && !fundStudnet.length)
                            ? 'no matches'
                            : (typeof value === 'object'
                                ? 'perfect match'
                                : 'matches found'
                            ),
                    studentsData: fundStudnet
                })
            }
            res.status(422)
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports = new Controllers();