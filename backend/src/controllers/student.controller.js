const { Student } = require('../../models/User');
const Branch = require('../../models/Branch');
const Course = require('../../models/Course');
const Assignment = require('../../models/Assignment');
const Submission = require('../../models/Submission');
const Attendance = require('../../models/Attendance');
const FinalGrade = require('../../models/FinalGrade');
const Timetable = require('../../models/Timetable');
const log = require('../utils/logger.utils');

// GET /api/student/dashboard
const getDashboard = async (req, res) => {
  const user_id = req.user_id;

  try {
    const student = await Student.findById(user_id).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const branchDoc = await Branch.findOne({
      code: student.branchCode,
      semesterNumber: student.currentSemester
    }).populate('courses', 'name code facultyId').lean();

    const courseIds = branchDoc?.courses?.map(c => c._id) ?? [];

    // Assignments + submission status
    const [assignments, submissions, grades, attendanceRecords] = await Promise.all([
      Assignment.find({ courseId: { $in: courseIds } }).sort({ dueDate: 1 }).lean(),
      Submission.find({ studentId: user_id }).lean(),
      FinalGrade.find({ studentId: user_id, courseId: { $in: courseIds } }).lean(),
      Attendance.find({ courseId: { $in: courseIds }, 'records.studentId': user_id }).lean(),
    ]);

    const submittedIds = new Set(submissions.map(s => s.assignmentId.toString()));
    const now = new Date();

    const assignmentList = assignments.map(a => {
      const courseObj = branchDoc?.courses?.find(c => c._id.toString() === a.courseId.toString());
      const submitted = submittedIds.has(a._id.toString());
      const overdue = a.dueDate && new Date(a.dueDate) < now && !submitted;
      return {
        id: a._id,
        title: a.title,
        description: a.description ?? '',
        course: courseObj?.name ?? 'Unknown Course',
        dueDate: a.dueDate ?? null,
        due: a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline',
        status: submitted ? 'Submitted' : overdue ? 'Overdue' : 'Pending',
        resourceUrl: a.resourceUrl,
        type: a.type,
      };
    });

    // Attendance trend — last 8 weeks per course, averaged
    const weeklyTrend = computeWeeklyAttendanceTrend(attendanceRecords, user_id, 8);

    // Quick stats
    const totalCourses = courseIds.length;
    const pendingAssignments = assignmentList.filter(a => a.status === 'Pending').length;
    const avgGrade = grades.length
      ? (grades.reduce((sum, g) => sum + (g.percentage ?? 0), 0) / grades.length).toFixed(1)
      : null;
    const overallAttendance = computeOverallAttendance(attendanceRecords, user_id);

    const quickStats = [
      { label: 'Courses Enrolled', value: String(totalCourses), subtext: `Semester ${student.currentSemester}` },
      { label: 'Pending Assignments', value: String(pendingAssignments), subtext: 'Due this semester' },
      { label: 'Overall Attendance', value: overallAttendance !== null ? `${overallAttendance}%` : 'N/A', subtext: 'Across all courses' },
      { label: 'Average Grade', value: avgGrade !== null ? `${avgGrade}%` : 'N/A', subtext: 'Current semester' },
    ];

    return res.status(200).json({
      success: true,
      student: { name: student.name, enrollmentNo: student.enrollmentNo, branchCode: student.branchCode, currentSemester: student.currentSemester },
      quickStats,
      assignments: assignmentList.slice(0, 5),
      attendanceTrend: weeklyTrend,
    });
  } catch (err) {
    log.error('getDashboard failed', err, { studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/student/assignments
const getMyAssignments = async (req, res) => {
  const user_id = req.user_id;

  try {
    const student = await Student.findById(user_id).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const branchDoc = await Branch.findOne({
      code: student.branchCode,
      semesterNumber: student.currentSemester
    }).populate('courses', 'name code').lean();

    const courseIds = branchDoc?.courses?.map(c => c._id) ?? [];

    const [assignments, submissions] = await Promise.all([
      Assignment.find({ courseId: { $in: courseIds } }).sort({ dueDate: 1 }).lean(),
      Submission.find({ studentId: user_id }).lean(),
    ]);

    const submittedIds = new Set(submissions.map(s => s.assignmentId.toString()));
    const now = new Date();

    const result = assignments.map(a => {
      const courseObj = branchDoc?.courses?.find(c => c._id.toString() === a.courseId.toString());
      const submitted = submittedIds.has(a._id.toString());
      const overdue = a.dueDate && new Date(a.dueDate) < now && !submitted;
      return {
        id: a._id,
        title: a.title,
        description: a.description ?? '',
        course: courseObj?.name ?? 'Unknown Course',
        dueDate: a.dueDate ?? null,
        due: a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline',
        status: submitted ? 'Submitted' : overdue ? 'Overdue' : 'Pending',
        resourceUrl: a.resourceUrl,
        type: a.type,
      };
    });

    return res.status(200).json({ success: true, assignments: result });
  } catch (err) {
    log.error('getMyAssignments failed', err, { studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/student/timetable
const getMyTimetable = async (req, res) => {
  const user_id = req.user_id;

  try {
    const student = await Student.findById(user_id).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const branchDoc = await Branch.findOne({
      code: student.branchCode,
      semesterNumber: student.currentSemester
    }).populate('courses', 'name code').lean();

    const courseIds = branchDoc?.courses?.map(c => c._id) ?? [];

    const [timetableEntries, attendanceRecords] = await Promise.all([
      Timetable.find({ courseId: { $in: courseIds } }).populate('courseId', 'name code').lean(),
      Attendance.find({ courseId: { $in: courseIds }, 'records.studentId': user_id }).lean(),
    ]);

    // Build per-course attendance %
    const attendanceMap = buildAttendanceMap(attendanceRecords, user_id, courseIds);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timetable = {};
    DAYS.forEach(day => { timetable[day] = []; });

    for (const entry of timetableEntries) {
      const day = entry.day;
      if (!DAYS.includes(day)) continue;
      const courseId = entry.courseId?._id?.toString();
      const attendance = attendanceMap[courseId] ?? null;
      timetable[day].push({
        time: entry.startTime,
        course: entry.courseId?.name ?? 'Unknown',
        room: entry.roomNo,
        attendance,
      });
    }

    return res.status(200).json({ success: true, timetable });
  } catch (err) {
    log.error('getMyTimetable failed', err, { studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAttendanceMap(records, studentId, courseIds) {
  const map = {};
  const studentIdStr = studentId.toString();

  for (const courseId of courseIds) {
    const courseIdStr = courseId.toString();
    const courseRecords = records.filter(r => r.courseId.toString() === courseIdStr);
    if (courseRecords.length === 0) { map[courseIdStr] = null; continue; }

    let present = 0;
    let total = 0;
    for (const rec of courseRecords) {
      const entry = rec.records.find(r => r.studentId.toString() === studentIdStr);
      if (entry) { total++; if (entry.status === 'Present') present++; }
    }
    map[courseIdStr] = total > 0 ? Math.round((present / total) * 100) : null;
  }
  return map;
}

function computeOverallAttendance(records, studentId) {
  const studentIdStr = studentId.toString();
  let present = 0, total = 0;
  for (const rec of records) {
    const entry = rec.records.find(r => r.studentId.toString() === studentIdStr);
    if (entry) { total++; if (entry.status === 'Present') present++; }
  }
  return total > 0 ? Math.round((present / total) * 100) : null;
}

function computeWeeklyAttendanceTrend(records, studentId, weeks) {
  const studentIdStr = studentId.toString();
  const now = new Date();
  const trend = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (w + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - w * 7);

    const weekRecords = records.filter(r => {
      const d = new Date(r.date);
      return d >= weekStart && d < weekEnd;
    });

    let present = 0, total = 0;
    for (const rec of weekRecords) {
      const entry = rec.records.find(r => r.studentId.toString() === studentIdStr);
      if (entry) { total++; if (entry.status === 'Present') present++; }
    }
    trend.push(total > 0 ? Math.round((present / total) * 100) : 0);
  }
  return trend;
}

// GET /api/student/courses
const getMyCourses = async (req, res) => {
  const user_id = req.user_id;
  try {
    const student = await Student.findById(user_id).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const branchDoc = await Branch.findOne({
      code: student.branchCode,
      semesterNumber: student.currentSemester
    }).populate('courses', 'name code facultyId').lean();

    const courses = branchDoc?.courses ?? [];
    return res.status(200).json({ success: true, courses });
  } catch (err) {
    log.error('getMyCourses failed', err, { studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/student/grades
const getMyGrades = async (req, res) => {
  const user_id = req.user_id;
  try {
    const student = await Student.findById(user_id).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const branchDoc = await Branch.findOne({
      code: student.branchCode,
      semesterNumber: student.currentSemester
    }).populate('courses', 'name code').lean();

    if (!branchDoc || !branchDoc.courses.length) {
      return res.status(200).json({ success: true, grades: [] });
    }

    const courseIds = branchDoc.courses.map(c => c._id);
    const grades = await FinalGrade.find({ studentId: user_id, courseId: { $in: courseIds } })
      .populate('courseId', 'name code').lean();

    const gradeMap = {};
    for (const g of grades) gradeMap[g.courseId._id.toString()] = g;

    const result = branchDoc.courses.map(course => {
      const g = gradeMap[course._id.toString()];
      return {
        course: { id: course._id, name: course.name, code: course.code },
        rollNumber: g?.rollNumber ?? null,
        percentage: g?.percentage ?? null,
        grade: g?.grade ?? 'Pending',
      };
    });

    return res.status(200).json({ success: true, grades: result });
  } catch (err) {
    log.error('getMyGrades failed', err, { studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getDashboard, getMyAssignments, getMyTimetable, getMyCourses, getMyGrades };
