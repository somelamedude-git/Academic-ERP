const {jwt} = require('jsonwebtoken');
const { User } = require(''); // fill once file is created under models
const bcrypt = require('bcrypt');

require('dotenv') // set up the config later, once file is created

const generateAccessToken = (user)=>{
	return jwt.sign(
		{id: user._id,
		email: user.email,
		role: user.role},
		process.env.ACCESS_TOKEN_SECRET,
		{expiresIn: '50m'}
	)
}

module.exports = {
	generateAccessToken
}
		
