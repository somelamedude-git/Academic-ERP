const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { markAttendance } = require('../controllers/attendance.controller');

router.use(authenticate);

router.post('/', markAttendance);

module.exports = router;
