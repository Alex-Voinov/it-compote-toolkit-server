const hooliHopService = require("./services/hooliHopService");

class Controllers {
    async getUser(req, res, next) {
        try {
            const { fullName, email, tel } = req.query;
            const params = {};
            if (email) params.email = email;
            if (fullName) params.name = fullName;
            if (tel) params.phone = tel;
            const fundStudnet = await hooliHopService.getStudent(params);
            console.log(fundStudnet)
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports = new Controllers();