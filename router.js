const Controllers = require('./controllers');
const checkCode = require('./middlewares/checkTeacherCode');
const checkZoomTableCode = require('./middlewares/checkZoomTableCode');
const Router = require('express').Router;
const router = new Router();


router.get('/get-student', Controllers.getUser);
router.get('/get-disciplines', Controllers.getDisciplines);
router.get('/get-last-thems', Controllers.getLastThems);
router.get('/get-topics-across-disciplines', Controllers.getTopicsAcrossDisciplines);
router.get('/get-activities-for-teacher-without-themes', checkCode, Controllers.getActivitiesForTeacherWithoutThemes);
router.get('/pick-group', Controllers.pickGroup);
router.get('/verify-teacher', Controllers.verifyTeacher)
router.get('/fill-activity-data', checkCode, Controllers.fillActivityData)


router.post('/update-activity-table', checkZoomTableCode, Controllers.updateActivityTable)


module.exports = router