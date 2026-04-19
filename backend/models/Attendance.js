const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course ID is required'] },
  date: { type: Date, required: [true, 'Date is required'] },
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' }
  }]
}, { timestamps: true });

attendanceSchema.index({ courseId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'records.studentId': 1 });
attendanceSchema.index({ courseId: 1, 'records.studentId': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
