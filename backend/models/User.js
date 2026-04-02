const mongoose = require('mongoose');

const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true
};

const BaseUserSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6 }
}, baseOptions);

const User = mongoose.model('User', BaseUserSchema);

const Student = User.discriminator('Student', new mongoose.Schema({
  enrollmentNo: { type: String, required: [true, 'Enrollment Number is required'], unique: true, trim: true },
  batchYear: { type: String, required: [true, 'Batch Year is required'] },
  degree: { type: String, required: [true, 'Degree is required'] },
  branchCode: {
    type: String,
    required: [true, 'Branch is required'],
    enum: ['BMS', 'BEE', 'IMT', 'IMG', 'BCS'],
    uppercase: true,
    trim: true
  },
  currentSemester: { type: Number, required: [true, 'Current semester is required'], min: 1, max: 10 }
}));

const Faculty = User.discriminator('Faculty', new mongoose.Schema({
  employee_id: { type: String, required: [true, 'Employee ID is required'], unique: true, trim: true },
  designation: { type: String, required: [true, 'Designation is required'] },
  subjects: { type: [String], default: [] },
  department_name: { type: String, required: [true, 'Department Name is required'] }
}));

const Admin = User.discriminator('Admin', new mongoose.Schema({
  adminLevel: { type: String, default: 'Standard' },
  permissions: { type: [String], default: [] }
}));

module.exports = { User, Student, Faculty, Admin };
