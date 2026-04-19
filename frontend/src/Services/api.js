const BASE_URL = '/api';

const getToken = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('academic-erp-auth') || 'null');
    return auth?.accessToken ?? null;
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (method, path, body = null, isFormData = false) => {
  const headers = { ...authHeaders() };
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status, data });
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  request('POST', '/auth/login', { email, password });

// ── Student dashboard ─────────────────────────────────────────────────────────
export const getStudentDashboard = () => request('GET', '/student/dashboard');
export const getStudentAssignments = () => request('GET', '/student/assignments');
export const getStudentTimetable = () => request('GET', '/student/timetable');
export const getStudentCourses = () => request('GET', '/student/courses');
export const getStudentGrades = () => request('GET', '/student/grades');

// ── Courses ───────────────────────────────────────────────────────────────────
export const getCourses = () => request('GET', '/courses');

// ── Assignments (student) ─────────────────────────────────────────────────────
export const getCourseAssignments = (courseId) =>
  request('GET', `/assignments/course/${courseId}`);

export const submitAssignment = (assignmentId, formData) =>
  request('POST', `/assignments/${assignmentId}/submit`, formData, true);

// ── Grades ────────────────────────────────────────────────────────────────────
export const getMyGrades = () => request('GET', '/grades/me');

// ── Attendance ────────────────────────────────────────────────────────────────
export const markAttendance = (courseId, date, studentList) =>
  request('POST', '/attendance', { courseId, date, studentList });

// ── Faculty ───────────────────────────────────────────────────────────────────
export const getMyCourses = () => request('GET', '/faculty/my-courses');
export const getMaterials = (courseId) => request('GET', `/faculty/materials/${courseId}`);
export const addExternalLink = (courseId, title, externalUrl) =>
  request('POST', '/faculty/materials/link', { courseId, title, externalUrl });
export const deleteMaterial = (materialId) => request('DELETE', `/faculty/materials/${materialId}`);

export const getFacultyCourseAssignments = (courseId) =>
  request('GET', `/assignments/course/${courseId}`);
export const createAssignmentUrl = (courseId, title, description, dueDate, resourceUrl) =>
  request('POST', '/assignments', { courseId, title, description, dueDate, resourceUrl });
export const deleteAssignment = (assignmentId) => request('DELETE', `/assignments/${assignmentId}`);
export const getAssignmentSubmissions = (assignmentId) =>
  request('GET', `/assignments/${assignmentId}/submissions`);

export const assignGrades = (studentId, courseId, branchCode, rollNumber, percentage, grade) =>
  request('POST', '/grades', { studentId, courseId, branchCode, rollNumber, percentage, grade });

export const getFacultyQuizzes = () => request('GET', '/quiz/my');
export const createQuiz = (data) => request('POST', '/quiz', data);
export const setQuizVisibility = (quizId, isVisible) =>
  request('PATCH', `/quiz/${quizId}/visibility`, { isVisible });
export const expireQuiz = (quizId) => request('PATCH', `/quiz/${quizId}/expire`, {});
export const getQuizSubmissions = (quizId) => request('GET', `/quiz/submissions?quizId=${quizId}`);
export const reviewAndDeleteSubmission = (submissionId) =>
  request('DELETE', `/quiz/submission/${submissionId}/reviewed`);

export const getMyFeedback = (pageSize = 5) => request('GET', `/feedback?pageSize=${pageSize}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStats = () => request('GET', '/admin/stats');

export const listStudents = () => request('GET', '/admin/students');
export const addStudent = (studentData) => request('POST', '/admin/students', studentData);
export const removeStudent = (studentId) => request('DELETE', `/admin/students/${studentId}`);

export const listFaculty = () => request('GET', '/admin/faculty');
export const addFaculty = (facultyData) => request('POST', '/admin/faculty', facultyData);
export const removeFaculty = (facultyId) => request('DELETE', `/admin/faculty/${facultyId}`);

export const getStudentGradesAdmin = (studentId) => request('GET', `/admin/grades/${studentId}`);
export const editGrade = (gradeId, data) => request('PATCH', `/admin/grades/${gradeId}`, data);

export const getTimetables = () => request('GET', '/admin/timetable');
export const deleteTimetable = (timetableId) => request('DELETE', `/admin/timetable/${timetableId}`);

export const createCourse = (courseData) => request('POST', '/courses', courseData);
export const deleteCourse = (courseId) => request('DELETE', `/courses/${courseId}`);
export const addCourseToBranch = (branchCode, semesterNumber, courseId) =>
  request('POST', '/courses/branch/add', { branchCode, semesterNumber, courseId });
export const removeCourseFromBranch = (branchCode, semesterNumber, courseId) =>
  request('POST', '/courses/branch/remove', { branchCode, semesterNumber, courseId });

// ── Student quiz/feedback ─────────────────────────────────────────────────────
export const getCourseQuizzes = (courseId) => request('GET', `/quiz/course/${courseId}`);
export const submitQuiz = (quizId, answers) => request('POST', `/quiz/${quizId}/submit`, { answers });
export const submitFeedback = (targetId, message, rating) =>
  request('POST', '/feedback', { targetId, message, rating });
export const submitComplaint = (description, assignedTo) =>
  request('POST', '/complaint', { description, assignedTo });
