const { User } = require('../../models/User');
const { generateAccessToken } = require('../utils/auth.utils');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Please recheck your credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Please recheck your credentials'
      });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: 'Successfully logged in',
      role: user.role,
      accessToken
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Some internal server error'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user_id).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, profile: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  const allowed = ['name'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No updatable fields provided' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.user_id, { $set: updates }, { new: true, runValidators: true }).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, message: 'Profile updated', profile: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }
  try {
    const user = await User.findById(req.user_id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login, getProfile, updateProfile, changePassword };
