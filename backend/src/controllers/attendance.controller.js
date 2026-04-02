const { Faculty, Student } = require('../../models/User');
const Attendance = require('../../models/Attendance');

const markAttendance = async (req, res) => {
  const user_id = req.user_id;
  const { studentList, courseId, date } = req.body;

  try {
    if (!studentList || studentList.length === 0) {
      return res.status(400).json({ success: false, message: 'No list provided' });
    }

    const faculty = await Faculty.findById(user_id);
    if (!faculty) {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    const records = [];

    for (const currStudent of studentList) {
      const exists = await Student.findOne({ enrollmentNo: currStudent.enrollmentNo }).lean();
      if (!exists) continue;
      records.push({ studentId: exists._id, status: 'Present' });
    }

    const attendance = new Attendance({ courseId, date, records });
    await attendance.save();

    return res.status(200).json({ success: true, message: 'Attendance marked successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

module.exports = { markAttendance };
