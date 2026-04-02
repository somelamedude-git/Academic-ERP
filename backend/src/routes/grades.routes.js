const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { assignGrades, getMyGrades } = require('../controllers/grades.controller');

router.use(authenticate);

router.post('/', requireRole('Faculty'), assignGrades);
router.get('/me', requireRole('Student'), getMyGrades);

module.exports = router;
