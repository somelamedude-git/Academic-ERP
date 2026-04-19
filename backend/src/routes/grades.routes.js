const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { assignGrades, getMyGrades, getStudentsByCourse } = require('../controllers/grades.controller');

router.use(authenticate);

router.post('/', requireRole('Faculty'), assignGrades);
router.get('/me', requireRole('Student'), getMyGrades);
router.get('/course/:courseId/students', requireRole('Faculty'), getStudentsByCourse);

module.exports = router;
