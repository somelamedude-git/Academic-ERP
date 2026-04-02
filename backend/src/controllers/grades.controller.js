const FinalGrade = require('../../models/FinalGrade');
const Branch = require('../../models/Branch');
const { Student } = require('../../models/User');

const assignGrades = async (req, res) => {
  const user_role = req.user_role;
  const { studentId, courseId, branchCode, rollNumber, percentage, grade } = req.body;

  try {
    if (user_role !== 'Faculty') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    const result = await FinalGrade.findOneAndUpdate(
      { studentId, courseId },
      { $set: { branchCode, rollNumber, percentage, grade } },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: 'Grade assigned successfully', grade: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

const getMyGrades = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;

  try {
    if (user_role !== 'Student') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

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

    const grades = await FinalGrade.find({
      studentId: user_id,
      courseId: { $in: courseIds }
    }).populate('courseId', 'name code').lean();

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
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

module.exports = { assignGrades, getMyGrades };
