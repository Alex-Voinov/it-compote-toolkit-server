const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./router')
const path = require('path');

const corsOptions = {
    origin: 'http://localhost:3000',//process.env.CLIENT_URL,
    credentials: true,
};

let reqForSGrup = 0;

const app = express();
console.log('Открыты порты на прослушивание')
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

app.use('/api', router);
app.get('*', (req, res) => {
    console.log('Колличество запросов к платформе по подбору групп:', reqForSGrup++)
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});