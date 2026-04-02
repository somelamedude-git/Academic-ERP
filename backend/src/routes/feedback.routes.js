const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { submitFeedback, getFeedback, submitComplaint } = require('../controllers/feedback.controller');

router.use(authenticate);

router.post('/feedback', requireRole('Student'), submitFeedback);
router.get('/feedback', requireRole('Faculty'), getFeedback);
router.post('/complaint', requireRole('Student'), submitComplaint);

module.exports = router;
