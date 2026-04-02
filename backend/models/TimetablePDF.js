const mongoose = require('mongoose');

// stores metadata for uploaded timetable PDFs
// OCR processing can be added later using cloudinaryUrl
const timetablePDFSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: true   // public URL for OCR or direct viewing
  },
  cloudinaryPublicId: {
    type: String,
    required: true   // needed to delete/replace the file later
  },
  originalName: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TimetablePDF', timetablePDFSchema);
