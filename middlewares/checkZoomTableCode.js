const checkZoomTableCode = (req, res, next) => {
    if (req.body.key && req.body.key === process.env.ZOOM_TABLE_CODE) {
        next(); 
    } else {
        res.status(401).send('Access denied: incorrect key-code');
    }
};

module.exports = checkZoomTableCode;