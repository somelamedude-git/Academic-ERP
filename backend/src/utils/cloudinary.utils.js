const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_PDF_MIME = 'application/pdf';
const ALLOWED_PPT_MIMES = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

// storage for timetable PDFs
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'timetables', resource_type: 'raw', format: 'pdf' }
});

// storage for course material (PDFs + PPTs) — raw keeps original format
const materialStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'course_materials',
    resource_type: 'raw',
    format: file.mimetype === ALLOWED_PDF_MIME ? 'pdf' : 'pptx'
  })
});

const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype === ALLOWED_PDF_MIME
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'), false);
  }
});

const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [ALLOWED_PDF_MIME, ...ALLOWED_PPT_MIMES];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF and PPT/PPTX files are allowed'), false);
  }
});

const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'assignments', resource_type: 'raw', format: 'pdf' }
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype === ALLOWED_PDF_MIME
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'), false);
  }
});

module.exports = { uploadPDF, uploadMaterial, uploadAssignment, cloudinary };
