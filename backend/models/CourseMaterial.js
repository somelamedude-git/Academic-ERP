const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['PDF', 'PPT', 'DRIVE_LINK'],
    required: [true, 'Material type is required']
  },
  // for PDF/PPT uploads via Cloudinary
  cloudinaryUrl: {
    type: String,
    trim: true
  },
  cloudinaryPublicId: {
    type: String,
    trim: true
  },
  // for Google Drive or any external link
  externalUrl: {
    type: String,
    trim: true
  },
  originalName: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
