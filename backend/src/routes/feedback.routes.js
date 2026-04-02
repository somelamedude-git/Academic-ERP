const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { submitFeedback, getFeedback, submitComplaint } = require('../controllers/feedback.controller');

router.use(authenticate);

router.post('/feedback', submitFeedback);
router.get('/feedback', getFeedback);
router.post('/complaint', submitComplaint);

module.exports = router;
