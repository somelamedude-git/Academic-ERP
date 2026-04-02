const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { uploadMaterial } = require('../utils/cloudinary.utils');
const { uploadMaterial: uploadMaterialCtrl, addExternalLink, getMaterials, deleteMaterial } = require('../controllers/faculty.controller');

router.use(authenticate);

router.post('/materials/upload', uploadMaterial.single('file'), uploadMaterialCtrl);
router.post('/materials/link', addExternalLink);
router.get('/materials/:courseId', getMaterials);
router.delete('/materials/:materialId', deleteMaterial);

module.exports = router;
