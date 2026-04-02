const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { markAttendance } = require('../controllers/attendance.controller');

router.use(authenticate);

router.post('/', requireRole('Faculty'), markAttendance);

module.exports = router;
