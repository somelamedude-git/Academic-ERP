const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./src/utils/socket.utils');

dotenv.config();

const app = express();
const server = http.createServer(app);

connectDB();
initSocket(server);

app.use(express.json());

app.use('/api/auth', require('./src/routes/user.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/faculty', require('./src/routes/faculty.routes'));
app.use('/api/assignments', require('./src/routes/assignment.routes'));
app.use('/api/attendance', require('./src/routes/attendance.routes'));
app.use('/api/grades', require('./src/routes/grades.routes'));
app.use('/api/quiz', require('./src/routes/quiz.routes'));
app.use('/api', require('./src/routes/feedback.routes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
