const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { createCourse, deleteCourse, addCourseToBranch, removeCourseFromBranch, getCourses } = require('../controllers/course.controller');

router.use(authenticate);

router.get('/', getCourses);
router.post('/', requireRole('Admin'), createCourse);
router.delete('/:courseId', requireRole('Admin'), deleteCourse);
router.post('/branch/add', requireRole('Admin'), addCourseToBranch);
router.post('/branch/remove', requireRole('Admin'), removeCourseFromBranch);

module.exports = router;
