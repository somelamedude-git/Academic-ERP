const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Branch name is required'], trim: true, enum: ['BMS', 'BEE', 'IMT', 'IMG', 'BCS'] },
  code: { type: String, required: [true, 'Branch code is required'], uppercase: true, trim: true, enum: ['BMS', 'BEE', 'IMT', 'IMG', 'BCS'] },
  semesterNumber: { type: Number, required: [true, 'Semester number is required'], min: 1, max: 10 },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
}, { timestamps: true });

branchSchema.index({ code: 1, semesterNumber: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);
