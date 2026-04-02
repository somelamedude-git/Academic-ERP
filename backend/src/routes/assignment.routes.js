const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { uploadAssignment } = require('../utils/cloudinary.utils');
const { createAssignment, deleteAssignment, getCourseAssignments } = require('../controllers/assignment.controller');

router.use(authenticate);

router.post('/', uploadAssignment.single('file'), createAssignment);
router.delete('/:assignmentId', deleteAssignment);
router.get('/course/:courseId', getCourseAssignments);

module.exports = router;
