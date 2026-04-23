const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { uploadPDF } = require('../utils/storage.utils');
const {
  addStudent, removeStudent, listStudents,
  addFaculty, removeFaculty, listFaculty,
  getAdminStats,
  getStudentGrades, editStudentGrade,
  uploadTimetable, getTimetables, deleteTimetable
} = require('../controllers/admin.controller');

router.use(authenticate, requireRole('Admin'));

router.get('/stats', getAdminStats);

router.get('/students', listStudents);
router.post('/students', addStudent);
router.delete('/students/:studentId', removeStudent);

router.get('/faculty', listFaculty);
router.post('/faculty', addFaculty);
router.delete('/faculty/:facultyId', removeFaculty);

router.get('/grades/:studentId', getStudentGrades);
router.patch('/grades/:gradeId', editStudentGrade);

router.post('/timetable', uploadPDF.single('file'), uploadTimetable);
router.get('/timetable', getTimetables);
router.delete('/timetable/:timetableId', deleteTimetable);

module.exports = router;
