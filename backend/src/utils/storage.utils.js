const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Upload directories ────────────────────────────────────────────────────────
const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

const DIRS = {
  timetables: path.join(UPLOAD_ROOT, 'timetables'),
  materials: path.join(UPLOAD_ROOT, 'materials'),
  assignments: path.join(UPLOAD_ROOT, 'assignments'),
  submissions: path.join(UPLOAD_ROOT, 'submissions'),
};

// Create all directories on startup
Object.values(DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const uniqueName = (originalname) => {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  return `${base}_${Date.now()}${ext}`;
};

const makeStorage = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DIRS[folder]),
    filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
  });

// ── Public URL helper ─────────────────────────────────────────────────────────
// Returns the URL path that Express will serve
const fileUrl = (folder, filename) => `/uploads/${folder}/${filename}`;

// ── Multer instances ──────────────────────────────────────────────────────────
const ALLOWED_PDF = 'application/pdf';
const ALLOWED_PPT = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const uploadPDF = multer({
  storage: makeStorage('timetables'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype === ALLOWED_PDF ? cb(null, true) : cb(new Error('Only PDF files are allowed')),
});

const uploadMaterial = multer({
  storage: makeStorage('materials'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    [ALLOWED_PDF, ...ALLOWED_PPT].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF and PPT/PPTX files are allowed')),
});

const uploadAssignment = multer({
  storage: makeStorage('assignments'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype === ALLOWED_PDF ? cb(null, true) : cb(new Error('Only PDF files are allowed')),
});

const uploadSubmission = multer({
  storage: makeStorage('submissions'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype === ALLOWED_PDF ? cb(null, true) : cb(new Error('Only PDF files are allowed')),
});

// ── Delete file helper ────────────────────────────────────────────────────────
const deleteFile = (folder, filename) => {
  if (!filename) return;
  const filePath = path.join(DIRS[folder], filename);
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
};

// ── Extract folder/filename from stored path ──────────────────────────────────
// Stored paths look like: /uploads/submissions/myfile_123.pdf
const parsePath = (urlPath) => {
  if (!urlPath) return { folder: null, filename: null };
  const parts = urlPath.replace(/^\/uploads\//, '').split('/');
  return { folder: parts[0] ?? null, filename: parts[1] ?? null };
};

module.exports = {
  uploadPDF, uploadMaterial, uploadAssignment, uploadSubmission,
  fileUrl, deleteFile, parsePath, UPLOAD_ROOT,
};
