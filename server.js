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
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

app.use('/api', router);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});