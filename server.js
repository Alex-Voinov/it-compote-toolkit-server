const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./router')
const path = require('path');

const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
};



const app = express();
console.log('Открыты порты на прослушивание')
app.use(cors(corsOptions));
app.use(bodyParser.json());

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
    console.log(`Сервер запущен на порту ${PORT}`);
});