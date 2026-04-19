const mongoose = require('mongoose');

const finalGradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Student ID is required'] },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course ID is required'] },
  rollNumber: { type: Number },
  percentage: { type: Number, min: 0, max: 100 },
  grade: { type: String, trim: true },
  branchCode: { type: String, enum: ['BMS', 'BEE', 'IMT', 'IMG', 'BCS'], required: [true, 'Branch code is required'] }
}, { timestamps: true });

finalGradeSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
finalGradeSchema.index({ studentId: 1 });
finalGradeSchema.index({ courseId: 1 });

module.exports = mongoose.model('FinalGrade', finalGradeSchema);
