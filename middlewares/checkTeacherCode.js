
const checkCode = (req, res, next) => {
    if (req.query.code && req.query.code === process.env.TEACHER_CODE) {
        next(); 
    } else {
        res.status(401).send('Access denied: incorrect password');
    }
};

module.exports = checkCode;