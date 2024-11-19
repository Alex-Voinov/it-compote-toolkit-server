const Controller = require('./controllers');
const Router = require('express').Router;
const router = new Router();

router.get('/get_user', Controller.getUser);

module.exports = router