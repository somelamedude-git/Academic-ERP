const Quiz = require('../../models/Quiz');
const QuizSubmission = require('../../models/QuizSubmission');
const { broadcastQuizUpdate } = require('../utils/socket.utils');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const createQuiz = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { courseId, title, mode, questions, externalLink, materialId } = req.body;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!courseId || !title || !mode) {
    return res.status(400).json({ success: false, message: 'courseId, title and mode are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }
  if (mode === 'IN_APP' && (!questions || questions.length === 0)) {
    return res.status(400).json({ success: false, message: 'Questions are required for IN_APP mode' });
  }
  if (mode === 'EXTERNAL_LINK' && !externalLink) {
    return res.status(400).json({ success: false, message: 'External link is required' });
  }
  if (mode === 'RAG' && !materialId) {
    return res.status(400).json({ success: false, message: 'Material ID is required for RAG mode' });
  }

  try {
    const quiz = new Quiz({
      facultyId: user_id,
      courseId,
      title,
      mode,
      questions: mode === 'IN_APP' ? questions : [],
      externalLink: mode === 'EXTERNAL_LINK' ? externalLink : undefined,
      materialId: mode === 'RAG' ? materialId : undefined
    });
    await quiz.save();
    log.info('Quiz created', { quizId: quiz._id, facultyId: user_id, courseId });
    return res.status(201).json({ success: true, message: 'Quiz created', quiz });
  } catch (err) {
    log.error('createQuiz failed', err, { facultyId: user_id, courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const setVisibility = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { quizId } = req.params;
  const { isVisible } = req.body;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({ success: false, message: 'Invalid quizId' });
  }
  if (isVisible === undefined) {
    return res.status(400).json({ success: false, message: 'isVisible is required' });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.facultyId.toString() !== user_id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your quiz' });
    }

    const updates = { isVisible };
    if (isVisible && !quiz.visibleFrom) {
      const now = new Date();
      updates.visibleFrom = now;
      updates.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    const updated = await Quiz.findByIdAndUpdate(quizId, { $set: updates }, { new: true });

    if (isVisible) {
      broadcastQuizUpdate(user_id, {
        event: 'quiz:visible',
        quizId: updated._id,
        courseId: updated.courseId,
        title: updated.title,
        mode: updated.mode,
        expiresAt: updated.expiresAt
      });
    }

    log.info('Quiz visibility updated', { quizId, isVisible, facultyId: user_id });
    return res.status(200).json({ success: true, message: 'Visibility updated', quiz: updated });
  } catch (err) {
    log.error('setVisibility failed', err, { quizId, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const expireQuiz = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { quizId } = req.params;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({ success: false, message: 'Invalid quizId' });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.facultyId.toString() !== user_id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your quiz' });
    }

    await Quiz.findByIdAndUpdate(quizId, { $set: { isExpired: true, isVisible: false } });
    log.info('Quiz expired', { quizId, facultyId: user_id });
    return res.status(200).json({ success: true, message: 'Quiz expired' });
  } catch (err) {
    log.error('expireQuiz failed', err, { quizId, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getSubmissions = async (req, res) => {
  const user_role = req.user_role;
  const { quizId } = req.query;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({ success: false, message: 'Valid quizId query param is required' });
  }

  try {
    const submissions = await QuizSubmission.find({ quizId })
      .populate('studentId', 'name enrollmentNo').lean();
    return res.status(200).json({ success: true, submissions });
  } catch (err) {
    log.error('getSubmissions failed', err, { quizId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const reviewAndDelete = async (req, res) => {
  const user_role = req.user_role;
  const { submissionId } = req.params;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return res.status(400).json({ success: false, message: 'Invalid submissionId' });
  }

  try {
    await QuizSubmission.findByIdAndDelete(submissionId);
    log.info('Quiz submission reviewed and deleted', { submissionId });
    return res.status(200).json({ success: true, message: 'Submission reviewed and deleted' });
  } catch (err) {
    log.error('reviewAndDelete failed', err, { submissionId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCourseQuizzes = async (req, res) => {
  const user_role = req.user_role;
  const { courseId } = req.params;

  if (user_role !== 'Student') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    const now = new Date();
    const quizzes = await Quiz.find({ courseId, isVisible: true, isExpired: false, expiresAt: { $gt: now } })
      .select('-questions.correctAnswer').lean();
    return res.status(200).json({ success: true, quizzes });
  } catch (err) {
    log.error('getCourseQuizzes failed', err, { courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const submitQuiz = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { quizId } = req.params;
  const { answers } = req.body;

  if (user_role !== 'Student') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({ success: false, message: 'Invalid quizId' });
  }
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: 'answers array is required' });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (!quiz.isVisible || quiz.isExpired || new Date() > quiz.expiresAt) {
      return res.status(400).json({ success: false, message: 'Quiz is not available' });
    }
    if (quiz.mode !== 'IN_APP') {
      return res.status(400).json({ success: false, message: 'This quiz is external — no submission needed' });
    }

    const submission = new QuizSubmission({ quizId, studentId: user_id, answers });
    await submission.save();
    log.info('Quiz submitted', { quizId, studentId: user_id });
    return res.status(201).json({ success: true, message: 'Quiz submitted successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted this quiz' });
    }
    log.error('submitQuiz failed', err, { quizId, studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createQuiz, setVisibility, expireQuiz, getSubmissions, reviewAndDelete, getCourseQuizzes, submitQuiz };
