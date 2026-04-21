const FeedbackQueue = require('../../models/FeedbackQueue');
const Complaint = require('../../models/Complaint');
const { User } = require('../../models/User');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const submitFeedback = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { targetId, message, rating } = req.body;
  const ratingNum = Number(rating);

  if (user_role !== 'Student') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!targetId || !message || rating === undefined) {
    return res.status(400).json({ success: false, message: 'targetId, message and rating are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ success: false, message: 'Invalid targetId' });
  }
  if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
    return res.status(400).json({ success: false, message: 'Rating must be a number between 0 and 10' });
  }

  try {
    await FeedbackQueue.findOneAndUpdate(
      { facultyId: targetId },
      { $push: { stack: { studentId: user_id, message, rating: ratingNum } } },
      { upsert: true, new: true }
    );
    log.info('Feedback submitted', { targetId, studentId: user_id });
    return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    log.error('submitFeedback failed', err, { targetId, studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getFeedback = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 5, 20);

  if (user_role !== 'Faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  try {
    const queueDoc = await FeedbackQueue.findOne({ facultyId: user_id });
    if (!queueDoc || queueDoc.stack.length === 0) {
      return res.status(200).json({ success: true, feedbacks: [], remaining: 0, hasMore: false });
    }

    const stack = queueDoc.stack;
    const total = stack.length;

    // Pop from the end (LIFO) — take the last `pageSize` items, newest first
    const page = stack.slice(-pageSize).reverse();
    const remaining = Math.max(0, total - pageSize);

    // Remove the consumed items from the stack
    await FeedbackQueue.findOneAndUpdate(
      { facultyId: user_id },
      { $set: { stack: stack.slice(0, remaining) } }
    );

    return res.status(200).json({ success: true, feedbacks: page, remaining, hasMore: remaining > 0 });
  } catch (err) {
    log.error('getFeedback failed', err, { facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const submitComplaint = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { description, assignedTo } = req.body;

  if (user_role !== 'Student') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!description || !assignedTo) {
    return res.status(400).json({ success: false, message: 'description and assignedTo (email) are required' });
  }

  try {
    const assignedUser = await User.findOne({ email: assignedTo.toLowerCase().trim() }).lean();
    if (!assignedUser) {
      return res.status(404).json({ success: false, message: 'Assigned user not found' });
    }

    const complaint = new Complaint({ studentId: user_id, description, assignedTo: assignedUser._id });
    await complaint.save();
    log.info('Complaint submitted', { studentId: user_id, assignedTo: assignedUser._id });
    return res.status(200).json({ success: true, message: 'Complaint submitted successfully' });
  } catch (err) {
    log.error('submitComplaint failed', err, { studentId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { submitFeedback, getFeedback, submitComplaint };
