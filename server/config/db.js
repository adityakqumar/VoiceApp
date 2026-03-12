const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI?.trim();
  const isRailway = Boolean(process.env.RAILWAY_PROJECT_ID);

  if (!mongoUri) {
    if (isRailway || process.env.NODE_ENV === 'production') {
      console.error('❌ MONGODB_URI is missing. Set it in Railway -> Service -> Variables.');
      process.exit(1);
    }

    console.warn('⚠️  MONGODB_URI not set. Falling back to local MongoDB for development.');
  }

  try {
    const conn = await mongoose.connect(mongoUri || 'mongodb://localhost:27017/voiceapp', {
      // Mongoose 8 uses these by default, but being explicit
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
