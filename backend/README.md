# Academic ERP — Backend

Node.js + Express + MongoDB backend for an academic ERP system serving three roles: Admin, Faculty, and Student.

---

## Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (Bearer token)
- **File Storage**: Cloudinary (PDFs, PPTs, assignment submissions)
- **Real-time**: Socket.IO
- **Rate Limiting**: express-rate-limit

---

## Project Structure

```
backend/
├── index.js                  # App entry point, Express setup, socket init
├── config/
│   └── db.js                 # MongoDB connection
├── models/                   # Mongoose schemas
│   ├── User.js               # Base user + Student/Faculty/Admin discriminators
│   ├── Branch.js             # Branch + semester + course list
│   ├── Course.js             # Individual course document
│   ├── Assignment.js
│   ├── Submission.js         # Assignment submissions (TTL: 1 month)
│   ├── Attendance.js
│   ├── FinalGrade.js
│   ├── Quiz.js
│   ├── QuizSubmission.js
│   ├── CourseMaterial.js
│   ├── FeedbackQueue.js      # Per-faculty feedback stack
│   ├── Complaint.js
│   └── TimetablePDF.js
└── src/
    ├── controllers/          # Route handlers
    ├── routes/               # Express routers
    ├── middleware/
    │   └── auth.middleware.js
    └── utils/
        ├── auth.utils.js     # JWT generation
        ├── cloudinary.utils.js
        ├── socket.utils.js
        └── logger.utils.js
```

---

## Core Architecture Decision: Branch-Semester Model

The central design choice is how students relate to courses.

**Traditional approach** — each student has an array of enrolled course IDs. Admin must manually assign 7+ courses per student on enrollment.

**This system** — a `Branch` document represents one branch + one semester and holds the course list for that combination. Students store only `branchCode` and `currentSemester`.

```
Branch { code: "BEE", semesterNumber: 3, courses: [courseId1, courseId2, ...] }
Student { branchCode: "BEE", currentSemester: 3, ... }
```

To get a student's courses: one query — `Branch.findOne({ code, semesterNumber })`.

Benefits:
- Admin enrolls a student by picking branch + semester, not 7 individual courses
- Adding a new course to a semester automatically applies to all students in that branch/semester
- Semester progression is a single field update on the student document

---

## User Model

Uses Mongoose discriminators — one `users` collection, role stored as `role` field.

```
User (base)
  ├── Student  — enrollmentNo, batchYear, degree, branchCode, currentSemester
  ├── Faculty  — employee_id, designation, subjects, department_name
  └── Admin    — adminLevel, permissions
```

---

## Authentication

JWT-based. Login returns an access token (50 min expiry). All protected routes require:

```
Authorization: Bearer <token>
```

The `authenticate` middleware decodes the token and sets `req.user_id` and `req.user_role` on every request.

---

## Real-time (Socket.IO)

Used for quiz notifications. When a faculty member makes a quiz visible, all students in that faculty's courses receive a `quiz:update` event instantly.

Room strategy:
- Faculty joins room `faculty:{userId}` on connect
- Students join the rooms of all faculty teaching their branch/semester courses

---

## File Storage (Cloudinary)

Three separate Cloudinary folders with different multer configurations:

| Folder | Used for | Size limit |
|---|---|---|
| `timetables` | Admin timetable PDFs | 10 MB |
| `course_materials` | Faculty PDFs and PPTs | 50 MB |
| `assignments` | Assignment briefs | 20 MB |
| `submissions` | Student submission PDFs | 20 MB |

Assignment submissions auto-delete from MongoDB after 1 month via a TTL index on `expiresAt`.

---

## Rate Limiting

| Route | Window | Max requests |
|---|---|---|
| `/api/auth` | 15 min | 20 |
| Upload routes | 60 min | 30 |
| All other `/api` routes | 15 min | 200 |

---

## API Routes

```
POST   /api/auth/login

# Admin
POST   /api/admin/students
DELETE /api/admin/students/:studentId
GET    /api/admin/grades/:studentId
PATCH  /api/admin/grades/:gradeId
POST   /api/admin/timetable
GET    /api/admin/timetable
DELETE /api/admin/timetable/:timetableId

# Courses
GET    /api/courses
POST   /api/courses
DELETE /api/courses/:courseId
POST   /api/courses/branch/add
POST   /api/courses/branch/remove

# Faculty Materials
POST   /api/faculty/materials/upload
POST   /api/faculty/materials/link
GET    /api/faculty/materials/:courseId
DELETE /api/faculty/materials/:materialId

# Assignments
POST   /api/assignments
DELETE /api/assignments/:assignmentId
GET    /api/assignments/course/:courseId
POST   /api/assignments/:assignmentId/submit
GET    /api/assignments/:assignmentId/submissions

# Attendance
POST   /api/attendance

# Grades
POST   /api/grades
GET    /api/grades/me

# Quiz
POST   /api/quiz
PATCH  /api/quiz/:quizId/visibility
PATCH  /api/quiz/:quizId/expire
GET    /api/quiz/submissions?quizId=
DELETE /api/quiz/submission/:submissionId/reviewed
GET    /api/quiz/course/:courseId
POST   /api/quiz/:quizId/submit

# Feedback & Complaints
POST   /api/feedback
GET    /api/feedback
POST   /api/complaint
```

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=
ACCESS_TOKEN_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Setup

```bash
npm install
npm run dev
```
