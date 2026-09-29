require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Run listen only when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(process.env.PORT || 4000, () => {
      console.log(`Jronix backend running on port ${process.env.PORT || 4000}`);
    });
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
