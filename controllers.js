const hooliHopService = require("./services/hooliHopService");

class Controllers {
    async getUser(req, res, next) {
        try {
            const { fullName, email, tel } = req.query;
            if (fullName || email || tel) {
                const informationReceived = [
                    ...(tel ? [tel] : []),
                    ...(email ? [email] : []),
                    ...(fullName ? fullName.split(' ') : []),
                ];
                const fundStudnet = await hooliHopService.getStudent(informationReceived);
                console.log(fundStudnet)
            }
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports = new Controllers();