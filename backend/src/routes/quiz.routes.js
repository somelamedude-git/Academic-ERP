const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  createQuiz,
  setVisibility,
  expireQuiz,
  getSubmissions,
  reviewAndDelete,
  getCourseQuizzes,
  submitQuiz
} = require('../controllers/quiz.controller');

router.use(authenticate);

router.post('/', createQuiz);
router.patch('/:quizId/visibility', setVisibility);
router.patch('/:quizId/expire', expireQuiz);
router.get('/submissions', getSubmissions);
router.delete('/submission/:submissionId/reviewed', reviewAndDelete);
router.get('/course/:courseId', getCourseQuizzes);
router.post('/:quizId/submit', submitQuiz);

module.exports = router;
