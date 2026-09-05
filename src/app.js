const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const connectDB = require('./config/db');

// Basic route to check if server is running from browser
app.get('/', (req, res) => {
  res.send('Jronix Backend API is running perfectly! 🚀');
});

// Middleware to ensure DB connection on Vercel Serverless
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/auth', require('./routes/auth.routes'));
app.use('/workspaces', require('./routes/workspace.routes'));
app.use('/collections', require('./routes/collection.routes'));
app.use('/requests', require('./routes/request.routes'));
// app.use('/environments', require('./routes/environment.routes'));
// app.use('/history', require('./routes/history.routes'));
app.use('/sync', require('./routes/sync.routes'));
app.use('/proxy', require('./routes/proxy.routes'));

module.exports = app;
