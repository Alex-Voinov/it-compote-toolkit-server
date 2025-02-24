require('dotenv').config()
const express = require('express');         
const cors = require('cors');               // CORS для разрешения запросов
const bodyParser = require('body-parser');  
const router = require('./router')          // Отедльная маршрутизация для API
const path = require('path');               // Для создания путей к папкам
const logger = require('./logger');         // Подключение логгера


const devMode = false; 


const corsOptions = {
    origin: devMode? process.env.LOCAL_URL: process.env.CLIENT_URL, 
    credentials: true,
};


const app = express();
app.use(cors(corsOptions));                 // разрешения запросов только с этого же хоста
app.use(bodyParser.json());                 // Для обработки JSON и URL-кодированных данных

// Раздача статических файлов
app.use('/study-group', express.static(path.join(__dirname, 'builds', 'bandSoftware')));
app.use('/', express.static(path.join(__dirname, 'builds', 'webForm')));

// API
app.use('/api', router);

// Роут для React-приложения
app.get('/study-group/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'builds', 'bandSoftware', 'index.html'));
});
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'builds', 'webForm', 'index.html'));
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    logger.info(`Сервер запущен на порту ${PORT}`);
});