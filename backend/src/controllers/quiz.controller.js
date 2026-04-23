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
    const [quiz, submissions] = await Promise.all([
      Quiz.findById(quizId).lean(),
      QuizSubmission.find({ quizId }).populate('studentId', 'name enrollmentNo').lean(),
    ]);

    const result = submissions.map(s => {
      // Annotate each answer with correct/wrong
      const gradedAnswers = (s.answers ?? []).map(a => {
        const question = quiz?.questions?.find(q => q._id.toString() === a.questionId?.toString());
        const isCorrect = question && question.correctAnswer &&
          a.answerText?.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        return {
          questionId: a.questionId,
          questionText: question?.questionText ?? '—',
          answerText: a.answerText,
          correctAnswer: question?.correctAnswer ?? '—',
          isCorrect: Boolean(isCorrect),
        };
      });

      return {
        _id: s._id,
        studentId: s.studentId,
        score: s.score ?? 0,
        totalMarks: s.totalMarks ?? quiz?.questions?.length ?? 0,
        percentage: (s.totalMarks ?? 0) > 0 ? Math.round(((s.score ?? 0) / s.totalMarks) * 100) : 0,
        answers: gradedAnswers,
        submittedAt: s.createdAt,
      };
    });

    return res.status(200).json({ success: true, submissions: result, quizTitle: quiz?.title ?? '' });
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

    // Auto-grade: compare each answer to correctAnswer
    const totalMarks = quiz.questions.length;
    let score = 0;
    const gradedAnswers = answers.map(a => {
      const question = quiz.questions.find(q => q._id.toString() === a.questionId?.toString());
      const isCorrect = question && question.correctAnswer &&
        a.answerText?.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      if (isCorrect) score++;
      return { questionId: a.questionId, answerText: a.answerText };
    });

    const submission = new QuizSubmission({ quizId, studentId: user_id, answers: gradedAnswers, score, totalMarks });
    await submission.save();
    log.info('Quiz submitted', { quizId, studentId: user_id, score, totalMarks });

    // Return result immediately to student
    const resultDetails = quiz.questions.map(q => {
      const studentAnswer = gradedAnswers.find(a => a.questionId?.toString() === q._id.toString());
      const isCorrect = studentAnswer && q.correctAnswer &&
        studentAnswer.answerText?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      return {
        questionText: q.questionText,
        yourAnswer: studentAnswer?.answerText ?? null,
        correctAnswer: q.correctAnswer,
        isCorrect: Boolean(isCorrect),
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully',
      result: { score, totalMarks, percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0, details: resultDetails },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted this quiz' });
    }
    log.error('submitQuiz failed', err, { quizId, studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createQuiz, setVisibility, expireQuiz, getSubmissions, reviewAndDelete, getCourseQuizzes, submitQuiz, getFacultyQuizzes };

async function getFacultyQuizzes(req, res) {
  const user_id = req.user_id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));
  const pageSize = Math.min(50, Number(limit));
  try {
    const [quizzes, total] = await Promise.all([
      Quiz.find({ facultyId: user_id }).populate('courseId', 'name code').sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Quiz.countDocuments({ facultyId: user_id }),
    ]);
    return res.status(200).json({ success: true, quizzes, total, page: Number(page), pages: Math.ceil(total / pageSize) });
  } catch (err) {
    log.error('getFacultyQuizzes failed', err, { facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
