const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { getDashboard, getMyAssignments, getMyTimetable, getMyCourses, getMyGrades, getMyFaculty } = require('../controllers/student.controller');

router.use(authenticate, requireRole('Student'));

router.get('/dashboard', getDashboard);
router.get('/courses', getMyCourses);
router.get('/assignments', getMyAssignments);
router.get('/timetable', getMyTimetable);
router.get('/grades', getMyGrades);
router.get('/faculty', getMyFaculty);

module.exports = router;
