const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Development, Staging, Production
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  variables: [{
    key: { type: String, required: true },
    value: { type: String },
    isSecret: { type: Boolean, default: false }, // encrypted at rest, masked in UI
  }],
}, { timestamps: true });

module.exports = mongoose.model('Environment', environmentSchema);
