const mongoose = require('mongoose');

// persisted so students who connect late can still fetch recent updates
const quizUpdateSchema = new mongoose.Schema({
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
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled date/time is required']
  },
  topics: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('QuizUpdate', quizUpdateSchema);
