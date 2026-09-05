const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
  sortOrder: { type: Number, default: 0 },

  requestKind: { type: String, enum: ['http', 'websocket', 'socketio'], default: 'http' },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] }, // only for http

  url: { type: String, default: '' },
  
  docs: { type: String, default: '' },

  headers: [{ key: String, value: String, description: { type: String, default: '' }, enabled: { type: Boolean, default: true } }],
  queryParams: [{ key: String, value: String, description: { type: String, default: '' }, enabled: { type: Boolean, default: true } }],

  bodyType: { type: String, enum: ['none', 'raw', 'raw-json', 'form-data', 'urlencoded', 'binary', 'graphql', 'file'], default: 'none' },
  bodyFormat: { type: String, default: 'json' }, // for raw (json, text, javascript, html, xml)
  body: { type: mongoose.Schema.Types.Mixed, default: {} }, // flexible — raw JSON, form fields, etc.

  authType: { type: String, enum: ['inherit', 'none', 'noauth', 'bearer', 'api-key', 'basic', 'jwt', 'oauth1', 'oauth2', 'digest', 'hawk', 'aws', 'ntlm', 'akamai', 'asap'], default: 'inherit' },
  authConfig: { type: mongoose.Schema.Types.Mixed, default: {} },

  // For WebSocket / Socket.IO requests
  socketConfig: {
    namespace: String,
    events: [String],      // list of event names to listen for (Socket.IO)
  },

  savedResponses: [{
    name: { type: String, required: true },
    status: Number,
    data: String,
    time: Number,
    size: Number,
    createdAt: { type: Date, default: Date.now }
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
