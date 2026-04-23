const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Branch = require('../../models/Branch');
const { Student } = require('../../models/User');

let io;


const branchFacultyCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const getCachedFacultyIds = async (branchCode, semesterNumber) => {
  const key = `${branchCode}:${semesterNumber}`;
  const cached = branchFacultyCache.get(key);

  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.facultyIds;
  }

  const branchDoc = await Branch.findOne({ code: branchCode, semesterNumber })
    .populate('courses', 'facultyId')
    .lean();

  const facultyIds = branchDoc
    ? branchDoc.courses.map(c => c.facultyId?.toString()).filter(Boolean)
    : [];

  branchFacultyCache.set(key, { facultyIds, ts: Date.now() });
  return facultyIds;
};

const invalidateBranchCache = (branchCode, semesterNumber) => {
  branchFacultyCache.delete(`${branchCode}:${semesterNumber}`);
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

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
      try {
        const student = await Student.findById(userId)
          .select('branchCode currentSemester')
          .lean();

        if (student) {
          const facultyIds = await getCachedFacultyIds(
            student.branchCode,
            student.currentSemester
          );
          for (const facultyId of facultyIds) {
            socket.join(`faculty:${facultyId}`);
          }
        }
      } catch {
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

module.exports = { initSocket, broadcastQuizUpdate, getIO, invalidateBranchCache };
