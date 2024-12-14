const Controllers = require('./controllers');
const checkCode = require('./middlewares/checkTeacherCode');
const Router = require('express').Router;
const router = new Router();

router.get('/get-student', Controllers.getUser);
router.get('/get-disciplines', Controllers.getDisciplines);
router.get('/get-last-thems', Controllers.getLastThems);
router.get('/get-topics-across-disciplines', Controllers.getTopicsAcrossDisciplines);
router.get('/get-activities-for-teacher-without-themes', checkCode, Controllers.getActivitiesForTeacherWithoutThemes);
router.get('/pick-group', Controllers.pickGroup);
router.get('/verify-teacher', Controllers.verifyTeacher)

module.exports = router