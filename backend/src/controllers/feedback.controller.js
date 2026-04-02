const FeedbackQueue = require('../../models/FeedbackQueue');
const Complaint = require('../../models/Complaint');
const { User } = require('../../models/User');

const submitFeedback = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { targetId, message, rating } = req.body;

  try {
    if (user_role !== 'Student') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    await FeedbackQueue.findOneAndUpdate(
      { facultyId: targetId },
      { $push: { stack: { studentId: user_id, message, rating } } },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

const getFeedback = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const pageSize = parseInt(req.query.pageSize) || 5;

  try {
    if (user_role !== 'Faculty') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    const queueDoc = await FeedbackQueue.findOne({ facultyId: user_id });

    if (!queueDoc || queueDoc.stack.length === 0) {
      return res.status(200).json({ success: true, feedbacks: [], remaining: 0, message: 'No feedback available' });
    }

    const stack = queueDoc.stack;
    const total = stack.length;
    const page = stack.slice(-pageSize).reverse();
    const remaining = Math.max(0, total - pageSize);

    await FeedbackQueue.findOneAndUpdate(
      { facultyId: user_id },
      { $push: { stack: { $each: [], $slice: remaining } } }
    );

    return res.status(200).json({ success: true, feedbacks: page, remaining, hasMore: remaining > 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

const submitComplaint = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { description, assignedTo } = req.body;

  try {
    if (user_role !== 'Student') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    const assignedUser = await User.findOne({ email: assignedTo }).lean();
    if (!assignedUser) {
      return res.status(404).json({ success: false, message: 'Assigned user not found' });
    }

    const complaint = new Complaint({ studentId: user_id, description, assignedTo: assignedUser._id });
    await complaint.save();

    return res.status(200).json({ success: true, message: 'Complaint submitted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

module.exports = { submitFeedback, getFeedback, submitComplaint };
