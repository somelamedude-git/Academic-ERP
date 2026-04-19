const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: [true, 'Assignment ID is required'] },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Student ID is required'] },
  submissionType: { type: String, enum: ['File', 'URL'], required: true },
  cloudinaryUrl: { type: String, trim: true },
  cloudinaryPublicId: { type: String },
  submissionUrl: { type: String, trim: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Submission', submissionSchema);
