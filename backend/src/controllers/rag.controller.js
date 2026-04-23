const Quiz = require('../../models/Quiz');
const CourseMaterial = require('../../models/CourseMaterial');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const log = require('../utils/logger.utils');

const RAG_URL = (process.env.RAG_SERVICE_URL || 'http://localhost:8010').replace(/\/$/, '');
const RAG_API_KEY = process.env.RAG_SERVICE_API_KEY || 'change_me_internal_key';


const callRAG = async (endpoint, body) => {
  const res = await fetch(`${RAG_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-rag-api-key': RAG_API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = text;
    try { detail = JSON.parse(text)?.detail ?? text; } catch { /* keep raw */ }
    throw Object.assign(new Error(`RAG service error ${res.status}: ${detail}`), { status: res.status });
  }
  return res.json();
};


const ingestMaterial = async (req, res) => {
  const user_id = req.user_id;
  const { courseId, title } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'PDF file is required' });
  }
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Valid courseId is required' });
  }
  if (!title?.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }

  // Save uploaded buffer to a temp file
  const tmpPath = path.join(os.tmpdir(), `rag_${Date.now()}_${req.file.originalname}`);
  try {
    fs.writeFileSync(tmpPath, req.file.buffer);

    // Generate a short unique material_id (max 63 chars, alphanumeric + hyphens)
    const shortId = crypto
      .createHash('sha1')
      .update(`${user_id}_${courseId}_${Date.now()}`)
      .digest('hex')
      .slice(0, 20);
    const materialId = `mat-${shortId}`;

    const ragRes = await callRAG('/v1/materials/index', {
      course_id: courseId,
      material_id: materialId,
      title: title.trim(),
      local_file_path: tmpPath,
    });

    log.info('RAG material indexed from local file', { courseId, facultyId: user_id });
    return res.status(200).json({
      success: true,
      message: 'PDF indexed successfully',
      materialId: materialId,
      chunksIndexed: ragRes.chunks_indexed,
      courseId,
      title: title.trim(),
      rag: ragRes,
    });
  } catch (err) {
    log.error('RAG ingest failed', err, { courseId });
    return res.status(502).json({ success: false, message: err.message || 'RAG service unavailable' });
  } finally {
 
    try { fs.unlinkSync(tmpPath); } catch {}
  }
};


const generateQuestions = async (req, res) => {
  const {
    materialId, courseId, title,
    count = 5, questionTypes = ['MCQ'], difficulty = 'medium', topicHint = '',
  } = req.body;

  if (!materialId || !courseId || !title) {
    return res.status(400).json({ success: false, message: 'materialId, courseId and title are required' });
  }

  try {
    const ragRes = await callRAG('/v1/assessments/generate', {
      course_id: courseId,
      material_id: materialId,
      assessment_type: 'QUIZ',
      title,
      question_count: Math.min(Math.max(1, Number(count)), 20),
      question_types: questionTypes,
      difficulty,
      topic_hint: topicHint,
      marks_per_question: 1,
      temperature: 0.2,
    });

    log.info('RAG questions generated', { materialId, count });
    return res.status(200).json({ success: true, questions: ragRes.questions ?? [] });
  } catch (err) {
    log.error('RAG generate-questions failed', err, { materialId });
    return res.status(502).json({ success: false, message: err.message || 'RAG service unavailable' });
  }
};


const getIngestStatus = async (req, res) => {
  try {
    const healthRes = await fetch(`${RAG_URL}/health`, { headers: { 'x-rag-api-key': RAG_API_KEY } });
    return res.status(200).json({ success: true, serviceUp: healthRes.ok });
  } catch {
    return res.status(200).json({ success: true, serviceUp: false });
  }
};


const queryRAG = async (req, res) => {
  const user_id = req.user_id;
  const { quizId, question } = req.body;

  if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({ success: false, message: 'Valid quizId is required' });
  }
  if (!question?.trim()) {
    return res.status(400).json({ success: false, message: 'question is required' });
  }

  try {
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.mode !== 'RAG') return res.status(400).json({ success: false, message: 'Not a RAG quiz' });
    if (!quiz.isVisible || quiz.isExpired) return res.status(400).json({ success: false, message: 'Quiz not available' });
    if (!quiz.materialId) return res.status(400).json({ success: false, message: 'Quiz has no linked material' });

    const material = await CourseMaterial.findById(quiz.materialId).lean();
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const ragRes = await callRAG('/v1/assessments/generate', {
      course_id: material.courseId.toString(),
      material_id: quiz.materialId.toString(),
      assessment_type: 'QUIZ',
      title: material.title,
      question_count: 1,
      question_types: ['MCQ'],
      topic_hint: question.trim(),
      difficulty: 'medium',
      marks_per_question: 1,
      temperature: 0.4,
    });

    log.info('RAG query answered', { quizId, studentId: user_id });
    return res.status(200).json({ success: true, answer: ragRes.questions?.[0] ?? null });
  } catch (err) {
    log.error('RAG query failed', err, { quizId });
    return res.status(502).json({ success: false, message: err.message || 'RAG service unavailable' });
  }
};

module.exports = { ingestMaterial, generateQuestions, queryRAG, getIngestStatus };
