const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, trim: true }
}, { _id: true });

const quizSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: [true, 'Quiz title is required'], trim: true },
  mode: { type: String, enum: ['IN_APP', 'EXTERNAL_LINK', 'RAG'], required: true },
  questions: { type: [questionSchema], default: [] },
  externalLink: { type: String, trim: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial' },
  isVisible: { type: Boolean, default: false },
  visibleFrom: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  isExpired: { type: Boolean, default: false }
}, { timestamps: true });

quizSchema.index({ facultyId: 1, createdAt: -1 });
quizSchema.index({ courseId: 1, isVisible: 1, isExpired: 1, expiresAt: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
