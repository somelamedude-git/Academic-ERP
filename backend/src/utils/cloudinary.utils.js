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

const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'timetables', resource_type: 'raw', format: 'pdf' }
});

const materialStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder: 'course_materials',
    resource_type: 'raw',
    format: file.mimetype === ALLOWED_PDF_MIME ? 'pdf' : 'pptx'
  })
});

const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'assignments', resource_type: 'raw', format: 'pdf' }
});

const submissionStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'submissions',
    resource_type: 'raw',
    format: 'pdf',
    type: 'upload',
  }
});

const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === ALLOWED_PDF_MIME ? cb(null, true) : cb(new Error('Only PDF files are allowed'), false);
  }
});

const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [ALLOWED_PDF_MIME, ...ALLOWED_PPT_MIMES];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF and PPT/PPTX files are allowed'), false);
  }
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === ALLOWED_PDF_MIME ? cb(null, true) : cb(new Error('Only PDF files are allowed'), false);
  }
});

const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === ALLOWED_PDF_MIME ? cb(null, true) : cb(new Error('Only PDF files are allowed'), false);
  }
});

module.exports = { uploadPDF, uploadMaterial, uploadAssignment, uploadSubmission, cloudinary, getSignedUrl, getPublicUrl };

// For files uploaded before the public type fix, they are 'authenticated'.
// For new uploads they are 'upload' (public) and don't need signing.
// We generate a signed authenticated URL to cover both cases — Cloudinary
// will serve it if the asset exists under either type.
function getSignedUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });
}

function getPublicUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
  });
}
