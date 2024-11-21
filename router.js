const Controllers = require('./controllers');
const Router = require('express').Router;
const router = new Router();

router.get('/get-student', Controllers.getUser);

module.exports = router