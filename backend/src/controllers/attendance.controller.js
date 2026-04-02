const { Faculty, Student } = require('../../models/User');
const Attendance = require('../../models/Attendance');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const markAttendance = async (req, res) => {
  const user_id = req.user_id;
  const { studentList, courseId, date } = req.body;
    return res.status(400).json({ success: false, message: 'studentList is required' });
  }
  if (!courseId || !date) {
    return res.status(400).json({ success: false, message: 'courseId and date are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    const faculty = await Faculty.findById(user_id);
    if (!faculty) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const enrollmentNos = studentList.map(s => s.enrollmentNo);
    const students = await Student.find({ enrollmentNo: { $in: enrollmentNos } }).select('_id').lean();
    const records = students.map(s => ({ studentId: s._id, status: 'Present' }));

    const attendance = new Attendance({ courseId, date, records });
    await attendance.save();

    log.info('Attendance marked', { courseId, date, count: records.length, facultyId: user_id });
    return res.status(200).json({ success: true, message: 'Attendance marked successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this course and date' });
    }
    log.error('markAttendance failed', err, { courseId, date, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { markAttendance };
