const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Assignment title is required'], trim: true },
  description: { type: String, trim: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course ID is required'] },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Faculty ID is required'] },
  type: { type: String, enum: ['File', 'URL'], required: [true, 'Assignment type is required'] },
  resourceUrl: { type: String, trim: true },
  cloudinaryPublicId: { type: String },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
