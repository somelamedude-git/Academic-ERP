const mongoose = require('mongoose');

// One document per faculty — acts as a stack of feedbacks
// Key: facultyId, Value: array of feedback entries (stack, LIFO)
const feedbackEntrySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const feedbackQueueSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // one document per faculty
  },
  // stack: newest items pushed to end, popped from end (LIFO)
  stack: {
    type: [feedbackEntrySchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('FeedbackQueue', feedbackQueueSchema);
