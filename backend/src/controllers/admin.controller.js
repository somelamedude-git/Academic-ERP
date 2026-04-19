const { Student, Faculty, User } = require('../../models/User');
const Branch = require('../../models/Branch');
const FinalGrade = require('../../models/FinalGrade');
const TimetablePDF = require('../../models/TimetablePDF');
const { cloudinary } = require('../utils/cloudinary.utils');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const getStudentGrades = async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: 'Invalid studentId' });
  }

  try {
    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const branchDoc = await Branch.findOne({
      code: student.branchCode,
      semesterNumber: student.currentSemester
    }).populate('courses', 'name code').lean();

    if (!branchDoc || branchDoc.courses.length === 0) {
      return res.status(200).json({
        success: true,
        student: { id: student._id, name: student.name, enrollmentNo: student.enrollmentNo },
        grades: []
      });
    }

    const courseIds = branchDoc.courses.map(c => c._id);
    const grades = await FinalGrade.find({ studentId, courseId: { $in: courseIds } })
      .populate('courseId', 'name code').lean();

    const result = grades.map(g => ({
      gradeId: g._id,
      course: { id: g.courseId._id, name: g.courseId.name, code: g.courseId.code },
      rollNumber: g.rollNumber,
      percentage: g.percentage,
      grade: g.grade,
      branchCode: g.branchCode
    }));

    return res.status(200).json({
      success: true,
      student: { id: student._id, name: student.name, enrollmentNo: student.enrollmentNo },
      grades: result
    });
  } catch (err) {
    log.error('getStudentGrades failed', err, { studentId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const editStudentGrade = async (req, res) => {
  const { gradeId } = req.params;
  const { percentage, grade, rollNumber } = req.body;

  if (!mongoose.Types.ObjectId.isValid(gradeId)) {
    return res.status(400).json({ success: false, message: 'Invalid gradeId' });
  }

  const updates = {};
  if (percentage !== undefined) updates.percentage = percentage;
  if (grade !== undefined) updates.grade = grade;
  if (rollNumber !== undefined) updates.rollNumber = rollNumber;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No fields provided to update' });
  }

  try {
    const updated = await FinalGrade.findByIdAndUpdate(gradeId, { $set: updates }, { new: true, runValidators: true })
      .populate('courseId', 'name code').lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Grade record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Grade updated successfully',
      grade: {
        gradeId: updated._id,
        course: { id: updated.courseId._id, name: updated.courseId.name, code: updated.courseId.code },
        rollNumber: updated.rollNumber,
        percentage: updated.percentage,
        grade: updated.grade,
        branchCode: updated.branchCode
      }
    });
  } catch (err) {
    log.error('editStudentGrade failed', err, { gradeId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const uploadTimetable = async (req, res) => {
  const user_id = req.user_id;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
  }

  try {
    const timetable = new TimetablePDF({
      uploadedBy: user_id,
      cloudinaryUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      originalName: req.file.originalname
    });
    await timetable.save();
    log.info('Timetable uploaded', { timetableId: timetable._id, uploadedBy: user_id });
    return res.status(201).json({
      success: true,
      message: 'Timetable uploaded successfully',
      timetable: { id: timetable._id, url: timetable.cloudinaryUrl, uploadedAt: timetable.createdAt }
    });
  } catch (err) {
    log.error('uploadTimetable failed', err, { uploadedBy: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTimetables = async (req, res) => {
  try {
    const timetables = await TimetablePDF.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, timetables });
  } catch (err) {
    log.error('getTimetables failed', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteTimetable = async (req, res) => {
  const { timetableId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(timetableId)) {
    return res.status(400).json({ success: false, message: 'Invalid timetableId' });
  }

  try {
    const timetable = await TimetablePDF.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }
    await cloudinary.uploader.destroy(timetable.cloudinaryPublicId, { resource_type: 'raw' });
    await TimetablePDF.findByIdAndDelete(timetableId);
    log.info('Timetable deleted', { timetableId });
    return res.status(200).json({ success: true, message: 'Timetable deleted successfully' });
  } catch (err) {
    log.error('deleteTimetable failed', err, { timetableId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addStudent = async (req, res) => {
  const { name, email, password, enrollmentNo, batchYear, degree, branchCode, currentSemester } = req.body;

  if (!name || !email || !password || !enrollmentNo || !batchYear || !degree || !branchCode || !currentSemester) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      enrollmentNo,
      batchYear,
      degree,
      branchCode: branchCode.toUpperCase(),
      currentSemester
    });
    await student.save();
    log.info('Student added', { studentId: student._id, enrollmentNo });
    return res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        enrollmentNo: student.enrollmentNo,
        branchCode: student.branchCode,
        currentSemester: student.currentSemester
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or enrollment number already exists' });
    }
    log.error('addStudent failed', err, { enrollmentNo });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeStudent = async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: 'Invalid studentId' });
  }

  try {
    const student = await Student.findByIdAndDelete(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    log.info('Student removed', { studentId });
    return res.status(200).json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    log.error('removeStudent failed', err, { studentId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const listStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password').sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, students });
  } catch (err) {
    log.error('listStudents failed', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const listFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().select('-password').sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, faculty });
  } catch (err) {
    log.error('listFaculty failed', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addFaculty = async (req, res) => {
  const { name, email, password, employee_id, designation, department_name, subjects } = req.body;

  if (!name || !email || !password || !employee_id || !designation || !department_name) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const faculty = new Faculty({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      employee_id,
      designation,
      department_name,
      subjects: subjects || []
    });
    await faculty.save();
    log.info('Faculty added', { facultyId: faculty._id, employee_id });
    return res.status(201).json({
      success: true,
      message: 'Faculty added successfully',
      faculty: { id: faculty._id, name: faculty.name, email: faculty.email, employee_id: faculty.employee_id, designation: faculty.designation, department_name: faculty.department_name }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or employee ID already exists' });
    }
    log.error('addFaculty failed', err, { employee_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeFaculty = async (req, res) => {
  const { facultyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(facultyId)) {
    return res.status(400).json({ success: false, message: 'Invalid facultyId' });
  }

  try {
    const faculty = await Faculty.findByIdAndDelete(facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    log.info('Faculty removed', { facultyId });
    return res.status(200).json({ success: true, message: 'Faculty removed successfully' });
  } catch (err) {
    log.error('removeFaculty failed', err, { facultyId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const [studentCount, facultyCount, courseCount] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      require('../../models/Course').countDocuments(),
    ]);
    return res.status(200).json({ success: true, stats: { students: studentCount, faculty: facultyCount, courses: courseCount } });
  } catch (err) {
    log.error('getAdminStats failed', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { addStudent, removeStudent, listStudents, listFaculty, addFaculty, removeFaculty, getAdminStats, getStudentGrades, editStudentGrade, uploadTimetable, getTimetables, deleteTimetable };
