const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { createQuiz, setVisibility, expireQuiz, getSubmissions, reviewAndDelete, getCourseQuizzes, submitQuiz, getFacultyQuizzes } = require('../controllers/quiz.controller');

router.use(authenticate);

router.post('/', requireRole('Faculty'), createQuiz);
router.get('/my', requireRole('Faculty'), getFacultyQuizzes);
router.patch('/:quizId/visibility', requireRole('Faculty'), setVisibility);
router.patch('/:quizId/expire', requireRole('Faculty'), expireQuiz);
router.get('/submissions', requireRole('Faculty'), getSubmissions);
router.delete('/submission/:submissionId/reviewed', requireRole('Faculty'), reviewAndDelete);
router.get('/course/:courseId', requireRole('Student'), getCourseQuizzes);
router.post('/:quizId/submit', requireRole('Student'), submitQuiz);

module.exports = router;
