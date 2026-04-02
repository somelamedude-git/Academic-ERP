const Assignment = require('../../models/Assignment');
const Submission = require('../../models/Submission');
const Branch = require('../../models/Branch');
const { Student } = require('../../models/User');
const { cloudinary } = require('../utils/cloudinary.utils');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const createAssignment = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { courseId, title, description, dueDate } = req.body;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!courseId || !title) {
    return res.status(400).json({ success: false, message: 'courseId and title are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  let type, resourceUrl, cloudinaryPublicId;
  if (req.file) {
    type = 'File';
    resourceUrl = req.file.path;
    cloudinaryPublicId = req.file.filename;
  } else if (req.body.resourceUrl) {
    type = 'URL';
    resourceUrl = req.body.resourceUrl;
  } else {
    return res.status(400).json({ success: false, message: 'Provide a file or a URL' });
  }

  try {
    const assignment = new Assignment({ title, description, courseId, facultyId: user_id, type, resourceUrl, cloudinaryPublicId, dueDate });
    await assignment.save();
    log.info('Assignment created', { assignmentId: assignment._id, courseId, facultyId: user_id });
    return res.status(201).json({ success: true, message: 'Assignment created', assignment });
  } catch (err) {
    log.error('createAssignment failed', err, { courseId, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteAssignment = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { assignmentId } = req.params;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignmentId' });
  }

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.facultyId.toString() !== user_id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own assignments' });
    }
    if (assignment.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(assignment.cloudinaryPublicId, { resource_type: 'raw' });
    }
    await Assignment.findByIdAndDelete(assignmentId);
    log.info('Assignment deleted', { assignmentId, facultyId: user_id });
    return res.status(200).json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    log.error('deleteAssignment failed', err, { assignmentId, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCourseAssignments = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    if (user_role === 'Student') {
      const student = await Student.findById(user_id).lean();
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      const branchDoc = await Branch.findOne({ code: student.branchCode, semesterNumber: student.currentSemester }).lean();
      if (!branchDoc || !branchDoc.courses.map(id => id.toString()).includes(courseId)) {
        return res.status(403).json({ success: false, message: 'This course is not part of your branch and semester' });
      }
    } else if (user_role !== 'Faculty' && user_role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const assignments = await Assignment.find({ courseId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, assignments });
  } catch (err) {
    log.error('getCourseAssignments failed', err, { courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const submitAssignment = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { assignmentId } = req.params;

  if (user_role !== 'Student') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignmentId' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
  }

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return res.status(400).json({ success: false, message: 'Assignment deadline has passed' });
    }

    const submission = new Submission({ assignmentId, studentId: user_id, cloudinaryUrl: req.file.path, cloudinaryPublicId: req.file.filename });
    await submission.save();
    log.info('Assignment submitted', { assignmentId, studentId: user_id });
    return res.status(201).json({ success: true, message: 'Assignment submitted successfully', submission });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted this assignment' });
    }
    log.error('submitAssignment failed', err, { assignmentId, studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAssignmentSubmissions = async (req, res) => {
  const user_role = req.user_role;
  const { assignmentId } = req.params;

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignmentId' });
  }

  try {
    const submissions = await Submission.find({ assignmentId }).populate('studentId', 'name enrollmentNo').lean();
    return res.status(200).json({ success: true, submissions });
  } catch (err) {
    log.error('getAssignmentSubmissions failed', err, { assignmentId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createAssignment, deleteAssignment, getCourseAssignments, submitAssignment, getAssignmentSubmissions };
