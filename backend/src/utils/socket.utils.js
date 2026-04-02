const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Branch = require('../../models/Branch');
const { Student } = require('../../models/User');
const Course = require('../../models/Course');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, role } = socket.user;

    if (role === 'Faculty') {
      socket.join(`faculty:${userId}`);
    }

    if (role === 'Student') {
      const student = await Student.findById(userId).select('branchCode currentSemester').lean();
      if (student) {
        const branchDoc = await Branch.findOne({
          code: student.branchCode,
          semesterNumber: student.currentSemester
        }).populate('courses', 'facultyId').lean();

        if (branchDoc) {
          for (const course of branchDoc.courses) {
            socket.join(`faculty:${course.facultyId}`);
          }
        }
      }
    }

    socket.on('disconnect', () => {});
  });

  return io;
};

const broadcastQuizUpdate = (facultyId, payload) => {
  if (!io) throw new Error('Socket.io not initialized');
  io.to(`faculty:${facultyId}`).emit('quiz:update', payload);
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, broadcastQuizUpdate, getIO };
