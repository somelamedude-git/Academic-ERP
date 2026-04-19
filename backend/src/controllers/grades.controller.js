const FinalGrade = require('../../models/FinalGrade');
const Branch = require('../../models/Branch');
const { Student } = require('../../models/User');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const assignGrades = async (req, res) => {
  const { studentId, courseId, branchCode, rollNumber, percentage, grade } = req.body;

  if (!studentId || !courseId || !branchCode || !grade) {
    return res.status(400).json({ success: false, message: 'studentId, courseId, branchCode and grade are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid studentId or courseId' });
  }

  try {
    const result = await FinalGrade.findOneAndUpdate(
      { studentId, courseId },
      { $set: { branchCode, rollNumber, percentage, grade } },
      { upsert: true, new: true, runValidators: true }
    );
    log.info('Grade assigned', { studentId, courseId });
    return res.status(200).json({ success: true, message: 'Grade assigned successfully', grade: result });
  } catch (err) {
    log.error('assignGrades failed', err, { studentId, courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyGrades = async (req, res) => {
  const user_id = req.user_id;

  try {
    const student = await Student.findById(user_id).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const branchDoc = await Branch.findOne({
      code: student.branchCode,
      semesterNumber: student.currentSemester
    }).populate('courses', 'name code').lean();

    if (!branchDoc || branchDoc.courses.length === 0) {
      return res.status(200).json({ success: true, grades: [], message: 'No courses found for your branch and semester' });
    }

    const courseIds = branchDoc.courses.map(c => c._id);
    const grades = await FinalGrade.find({ studentId: user_id, courseId: { $in: courseIds } })
      .populate('courseId', 'name code').lean();

    const gradeMap = {};
    for (const g of grades) {
      gradeMap[g.courseId._id.toString()] = g;
    }

    const result = branchDoc.courses.map(course => {
      const g = gradeMap[course._id.toString()];
      return {
        course: { id: course._id, name: course.name, code: course.code },
        rollNumber: g?.rollNumber ?? null,
        percentage: g?.percentage ?? null,
        grade: g?.grade ?? 'Pending',
        branchCode: g?.branchCode ?? student.branchCode
      };
    });

    return res.status(200).json({ success: true, grades: result });
  } catch (err) {
    log.error('getMyGrades failed', err, { studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/grades/course/:courseId/students
// Returns all students enrolled in branches that contain this course
const getStudentsByCourse = async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    // Find all branch+semester combos that contain this course
    const branches = await Branch.find({ courses: courseId }).lean();

    if (!branches.length) {
      return res.status(200).json({ success: true, students: [] });
    }

    // Collect all branch codes and semester numbers
    const conditions = branches.map(b => ({
      branchCode: b.code,
      currentSemester: b.semesterNumber,
    }));

    const students = await Student.find({ $or: conditions })
      .select('name email enrollmentNo branchCode currentSemester degree')
      .sort({ branchCode: 1, enrollmentNo: 1 })
      .lean();

    return res.status(200).json({ success: true, students });
  } catch (err) {
    log.error('getStudentsByCourse failed', err, { courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { assignGrades, getMyGrades, getStudentsByCourse };
