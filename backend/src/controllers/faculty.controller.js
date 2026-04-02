const CourseMaterial = require('../../models/CourseMaterial');
const { cloudinary } = require('../utils/cloudinary.utils');
const mongoose = require('mongoose');
const log = require('../utils/logger.utils');

const uploadMaterial = async (req, res) => {
  const user_id = req.user_id;
  const { courseId, title } = req.body;

  if (!courseId || !title) {
    return res.status(400).json({ success: false, message: 'courseId and title are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const isPPT = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ].includes(req.file.mimetype);

    const material = new CourseMaterial({
      facultyId: user_id,
      courseId,
      title,
      type: isPPT ? 'PPT' : 'PDF',
      cloudinaryUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      originalName: req.file.originalname
    });

    await material.save();
    log.info('Material uploaded', { materialId: material._id, courseId, facultyId: user_id, type: material.type });
    return res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      material: { id: material._id, title: material.title, type: material.type, url: material.cloudinaryUrl, uploadedAt: material.createdAt }
    });
  } catch (err) {
    log.error('uploadMaterial failed', err, { courseId, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addExternalLink = async (req, res) => {
  const user_id = req.user_id;
  const { courseId, title, externalUrl } = req.body;

  if (!courseId || !title || !externalUrl) {
    return res.status(400).json({ success: false, message: 'courseId, title and externalUrl are required' });
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    const material = new CourseMaterial({ facultyId: user_id, courseId, title, type: 'DRIVE_LINK', externalUrl });
    await material.save();
    log.info('External link added', { materialId: material._id, courseId, facultyId: user_id });
    return res.status(201).json({
      success: true,
      message: 'Link added successfully',
      material: { id: material._id, title: material.title, type: material.type, url: material.externalUrl, uploadedAt: material.createdAt }
    });
  } catch (err) {
    log.error('addExternalLink failed', err, { courseId, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMaterials = async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid courseId' });
  }

  try {
    const materials = await CourseMaterial.find({ courseId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, materials });
  } catch (err) {
    log.error('getMaterials failed', err, { courseId });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteMaterial = async (req, res) => {
  const user_id = req.user_id;
  const { materialId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    return res.status(400).json({ success: false, message: 'Invalid materialId' });
  }

  try {
    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    if (material.facultyId.toString() !== user_id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own materials' });
    }
    if (material.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'raw' });
    }
    await CourseMaterial.findByIdAndDelete(materialId);
    log.info('Material deleted', { materialId, facultyId: user_id });
    return res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    log.error('deleteMaterial failed', err, { materialId, facultyId: user_id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { uploadMaterial, addExternalLink, getMaterials, deleteMaterial };
