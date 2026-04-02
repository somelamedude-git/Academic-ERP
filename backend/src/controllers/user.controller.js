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

module.exports = {
  login
};
