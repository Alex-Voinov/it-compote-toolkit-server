const Controllers = require('./controllers');
const Router = require('express').Router;
const router = new Router();

router.get('/get-student', Controllers.getUser);
router.get('/get-disciplines', Controllers.getDisciplines);
router.get('/pick-group', Controllers.pickGroup);

module.exports = router