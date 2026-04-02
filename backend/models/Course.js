const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Course name is required'], trim: true },
  code: { type: String, required: [true, 'Course code is required'], unique: true, uppercase: true, trim: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Faculty assigned is required'] },
  weightage: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
