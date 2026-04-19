const express = require('express');
const router = express.Router();
const { login, getProfile, updateProfile, changePassword } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.patch('/profile/password', authenticate, changePassword);

module.exports = router;
