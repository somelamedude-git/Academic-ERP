const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Admin } = require('./models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = 'admin@iiitg.ac.in';
  const password = 'Admin@1234';

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await Admin.create({
    name: 'Super Admin',
    email,
    password: hashed,
    adminLevel: 'Super',
    permissions: ['all'],
  });

  console.log('✅ Admin seeded');
  console.log('   Email   :', email);
  console.log('   Password:', password);
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
