require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

connectDB().then(() => {
  app.listen(process.env.PORT || 4000, () => {
    console.log(`Jronix backend running on port ${process.env.PORT || 4000}`);
  });
});
