const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusCode: Number,
  responseTimeMs: Number,
  responseSizeBytes: Number,
  executedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('History', historySchema);
