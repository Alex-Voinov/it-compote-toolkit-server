const axios = require('axios');
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
            const response = await axiosInstance.get("GetStudents");
            console.log(response)
            return response.data;
        } catch (error) {
            console.error('Error in Hooli-Hop service:', error.message);
            throw error;
        }
    }
}

module.exports = new HooliHopService();

