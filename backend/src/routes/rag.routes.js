const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { ingestMaterial, generateQuestions, queryRAG, getIngestStatus } = require('../controllers/rag.controller');

// In-memory storage — file goes straight to buffer, no disk/Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'));
  },
});

router.use(authenticate);

// Faculty: upload PDF from local system → index into RAG
router.post('/ingest', requireRole('Faculty'), upload.single('file'), ingestMaterial);

// Faculty: generate questions from an already-indexed material
router.post('/generate-questions', requireRole('Faculty'), generateQuestions);

// Health check
router.get('/status/:materialId', getIngestStatus);
router.get('/status', getIngestStatus);

// Student: query a RAG quiz
router.post('/query', requireRole('Student'), queryRAG);

module.exports = router;
