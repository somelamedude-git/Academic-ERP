const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { uploadMaterial } = require('../utils/cloudinary.utils');
const { uploadMaterial: uploadMaterialCtrl, addExternalLink, getMaterials, deleteMaterial } = require('../controllers/faculty.controller');

router.use(authenticate);

router.post('/materials/upload', requireRole('Faculty'), uploadMaterial.single('file'), uploadMaterialCtrl);
router.post('/materials/link', requireRole('Faculty'), addExternalLink);
router.get('/materials/:courseId', getMaterials);
router.delete('/materials/:materialId', requireRole('Faculty'), deleteMaterial);

module.exports = router;
