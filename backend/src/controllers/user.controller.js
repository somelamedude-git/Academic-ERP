const { User } = require('../../models/User.js');
const bcrypt = require('bcrypt');

const login = async(req, res)=>{
	let { email, password } = req.body;
	email = email.toLowerCase().trim();
	
	const user = await User.findOne({email: email}).lean();
	if(!user){
		return res.status(404).json({
			success: false,
			message: "Please recheck your credentials"
		});
	}

	const isCorrect = await bcrypt.compare(password, user.password);
	if(!isCorrect){
		return res.status(400).json({
			success: false,
			message: "Please recheck your credentials"
		});
	}

	const user_role = user.role; // first check ki cookies use krni hain ya lpcal storage, then save krna hai, implementation left
// todooo
	return res.status(200).json({
		success: true,
		message: 'Successfully logged in',
		role: user_role,
	});
}

module.exports = {
	login
}

