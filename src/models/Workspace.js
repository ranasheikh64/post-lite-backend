const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Workspace', workspaceSchema);
