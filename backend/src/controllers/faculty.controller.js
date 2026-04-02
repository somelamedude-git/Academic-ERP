const CourseMaterial = require('../../models/CourseMaterial');
const { cloudinary } = require('../utils/cloudinary.utils');

const uploadMaterial = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { courseId, title } = req.body;

  try {
    if (user_role !== 'Faculty') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

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

    return res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      material: { id: material._id, title: material.title, type: material.type, url: material.cloudinaryUrl, uploadedAt: material.createdAt }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

const addExternalLink = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { courseId, title, externalUrl } = req.body;

  try {
    if (user_role !== 'Faculty') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    if (!externalUrl) {
      return res.status(400).json({ success: false, message: 'External URL is required' });
    }

    const material = new CourseMaterial({ facultyId: user_id, courseId, title, type: 'DRIVE_LINK', externalUrl });
    await material.save();

    return res.status(201).json({
      success: true,
      message: 'Link added successfully',
      material: { id: material._id, title: material.title, type: material.type, url: material.externalUrl, uploadedAt: material.createdAt }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

const getMaterials = async (req, res) => {
  const user_role = req.user_role;
  const { courseId } = req.params;

  try {
    if (!['Faculty', 'Student', 'Admin'].includes(user_role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

    const materials = await CourseMaterial.find({ courseId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({ success: true, materials });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

const deleteMaterial = async (req, res) => {
  const user_id = req.user_id;
  const user_role = req.user_role;
  const { materialId } = req.params;

  try {
    if (user_role !== 'Faculty') {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
    }

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

    return res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Some internal server error' });
  }
};

module.exports = { uploadMaterial, addExternalLink, getMaterials, deleteMaterial };
