const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./src/utils/socket.utils');

dotenv.config();

const app = express();
const server = http.createServer(app);

connectDB();
initSocket(server);

app.use(express.json({ limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Upload limit reached, try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter);
app.use('/api/admin/timetable', uploadLimiter);
app.use('/api/faculty/materials/upload', uploadLimiter);
app.use('/api/assignments', uploadLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', require('./src/routes/user.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/courses', require('./src/routes/course.routes'));
app.use('/api/faculty', require('./src/routes/faculty.routes'));
app.use('/api/assignments', require('./src/routes/assignment.routes'));
app.use('/api/attendance', require('./src/routes/attendance.routes'));
app.use('/api/grades', require('./src/routes/grades.routes'));
app.use('/api/quiz', require('./src/routes/quiz.routes'));
app.use('/api', require('./src/routes/feedback.routes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
