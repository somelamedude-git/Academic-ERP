const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { uploadAssignment, uploadSubmission } = require('../utils/storage.utils');
const { createAssignment, deleteAssignment, getCourseAssignments, submitAssignment, getAssignmentSubmissions, proxySubmissionFile } = require('../controllers/assignment.controller');

router.use(authenticate);

router.post('/', requireRole('Faculty'), uploadAssignment.single('file'), createAssignment);
router.delete('/:assignmentId', requireRole('Faculty'), deleteAssignment);
router.get('/course/:courseId', getCourseAssignments);
router.get('/submission-file/:submissionId', proxySubmissionFile);
router.post('/:assignmentId/submit', requireRole('Student'), uploadSubmission.single('file'), submitAssignment);
router.get('/:assignmentId/submissions', requireRole('Faculty'), getAssignmentSubmissions);

module.exports = router;
