const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course ID is required'] },
  title: { type: String, required: [true, 'Title is required'], trim: true },
  type: { type: String, enum: ['PDF', 'PPT', 'DRIVE_LINK'], required: [true, 'Material type is required'] },
  cloudinaryUrl: { type: String, trim: true },
  cloudinaryPublicId: { type: String, trim: true },
  externalUrl: { type: String, trim: true },
  originalName: { type: String, trim: true }
}, { timestamps: true });

courseMaterialSchema.index({ courseId: 1, createdAt: -1 });
courseMaterialSchema.index({ facultyId: 1 });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
