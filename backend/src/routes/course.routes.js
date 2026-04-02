const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { createCourse, deleteCourse, addCourseToBranch, removeCourseFromBranch, getCourses } = require('../controllers/course.controller');

router.use(authenticate);

router.get('/', getCourses);
router.post('/', createCourse);
router.delete('/:courseId', deleteCourse);
router.post('/branch/add', addCourseToBranch);
router.post('/branch/remove', removeCourseFromBranch);

module.exports = router;
