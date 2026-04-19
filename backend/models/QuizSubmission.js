const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answerText: { type: String, trim: true }
}, { _id: false });

const quizSubmissionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: [answerSchema], default: [] },
  reviewed: { type: Boolean, default: false }
}, { timestamps: true });

quizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });
quizSubmissionSchema.index({ quizId: 1 });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);
