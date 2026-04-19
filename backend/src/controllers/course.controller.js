const Course = require('../../models/Course');
const Branch = require('../../models/Branch');
const { invalidateBranchCache } = require('../utils/socket.utils');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const createCourse = async (req, res) => {
  const user_role = req.user_role;
  const { name, code, facultyId, weightage } = req.body;

  if (user_role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!name || !code || !facultyId) {
    return res.status(400).json({ success: false, message: 'name, code and facultyId are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(facultyId)) {
    return res.status(400).json({ success: false, message: 'Invalid facultyId' });
  }

  try {
    const course = new Course({ name, code: code.toUpperCase(), facultyId, weightage: weightage || {} });
    await course.save();
    log.info('Course created', { courseId: course._id, code: course.code });
    return res.status(201).json({ success: true, message: 'Course created', course });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    log.error('createCourse failed', err, { code });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteCourse = async (req, res) => {
  const user_role = req.user_role;
  const { courseId } = req.params;

  if (user_role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    await Branch.updateMany({}, { $pull: { courses: new mongoose.Types.ObjectId(courseId) } });
    log.info('Course deleted', { courseId });
    return res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (err) {
    log.error('deleteCourse failed', err, { courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addCourseToBranch = async (req, res) => {
  const user_role = req.user_role;
  const { branchCode, semesterNumber, courseId } = req.body;

  if (user_role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!branchCode || !semesterNumber || !courseId) {
    return res.status(400).json({ success: false, message: 'branchCode, semesterNumber and courseId are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    const branchDoc = await Branch.findOneAndUpdate(
      { code: branchCode.toUpperCase(), semesterNumber: Number(semesterNumber) },
      { $addToSet: { courses: courseId } },
      { upsert: true, new: true }
    );
    log.info('Course added to branch', { branchCode, semesterNumber, courseId });
    invalidateBranchCache(branchCode.toUpperCase(), Number(semesterNumber));
    return res.status(200).json({ success: true, message: 'Course added to branch', branch: branchDoc });
  } catch (err) {
    log.error('addCourseToBranch failed', err, { branchCode, semesterNumber, courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeCourseFromBranch = async (req, res) => {
  const user_role = req.user_role;
  const { branchCode, semesterNumber, courseId } = req.body;

  if (user_role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!branchCode || !semesterNumber || !courseId) {
    return res.status(400).json({ success: false, message: 'branchCode, semesterNumber and courseId are required' });
  }

  try {
    await Branch.findOneAndUpdate(
      { code: branchCode.toUpperCase(), semesterNumber: Number(semesterNumber) },
      { $pull: { courses: new mongoose.Types.ObjectId(courseId) } }
    );
    log.info('Course removed from branch', { branchCode, semesterNumber, courseId });
    invalidateBranchCache(branchCode.toUpperCase(), Number(semesterNumber));
    return res.status(200).json({ success: true, message: 'Course removed from branch' });
  } catch (err) {
    log.error('removeCourseFromBranch failed', err, { branchCode, semesterNumber, courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('facultyId', 'name email').lean();
    return res.status(200).json({ success: true, courses });
  } catch (err) {
    log.error('getCourses failed', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createCourse, deleteCourse, addCourseToBranch, removeCourseFromBranch, getCourses };
