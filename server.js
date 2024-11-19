const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./router')


const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
};


const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/api', router);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});