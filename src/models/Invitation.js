const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
  token: { type: String, required: true, unique: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Invitation', invitationSchema);
