const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  options: { type: [String], default: [] }, // empty for open-ended
  correctAnswer: { type: String, trim: true } // optional, for MCQ
}, { _id: true });

const quizSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },

  // three modes — only one should be set
  mode: {
    type: String,
    enum: ['IN_APP', 'EXTERNAL_LINK', 'RAG'],
    required: true
  },

  // IN_APP mode
  questions: {
    type: [questionSchema],
    default: []
  },

  // EXTERNAL_LINK mode (Google Form or any URL)
  externalLink: {
    type: String,
    trim: true
  },

  // RAG mode — reference to a CourseMaterial doc
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseMaterial'
  },

  // visibility & expiration
  isVisible: {
    type: Boolean,
    default: false  // professor controls when students can see it
  },
  visibleFrom: {
    type: Date,
    default: null   // set when professor makes it visible
  },
  expiresAt: {
    type: Date,
    default: null   // auto-set to visibleFrom + 24h, or manual expire
  },
  isExpired: {
    type: Boolean,
    default: false  // professor can force-expire
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
