const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;

  if (!uri) {
    console.warn('MONGO_URI not set. Running without database connection.');
    console.log('For full functionality, configure MongoDB in .env');
    return;
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('MONGO_URI format invalid:', uri);
    console.log('Expected mongodb://... or mongodb+srv://...');
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
    return;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (error.name === 'MongoServerSelectionError') {
      console.log('Check network access/firewall, cluster hostname, DNS, and Atlas IP whitelist.');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.log('Auth failed: check username/password in MONGO_URI and Atlas database user credentials.');
      console.log('Example: mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/<db>?retryWrites=true&w=majority');

      const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/college-events';

      try {
        await mongoose.connect(localUri, {
          dbName,
          serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected via local fallback:', localUri);
        return;
      } catch (localError) {
        console.error('Local MongoDB fallback error:', localError.message);
      }
    }

    console.log('Running in offline mode. Some features may not work.');
  }
};

module.exports = connectDB;
