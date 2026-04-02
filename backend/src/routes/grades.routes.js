const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { assignGrades, getMyGrades } = require('../controllers/grades.controller');

router.use(authenticate);

router.post('/', assignGrades);
router.get('/me', getMyGrades);

module.exports = router;
