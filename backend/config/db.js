const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt connection with a strict 2-second connection timeout
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopez', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useMemoryDB = false;
  } catch (error) {
    console.log(`\n======================================================`);
    console.log(`WARNING: Could not connect to MongoDB: ${error.message}`);
    console.log(`FALLING BACK TO AN IN-MEMORY MOCK DATABASE ENGINE!`);
    console.log(`All operations (Auth, Trades, Admin) will run in RAM.`);
    console.log(`======================================================\n`);
    
    // Seed and boot memory simulator
    const memoryDb = require('./memoryDb');
    memoryDb.startSimulator();
    global.useMemoryDB = true;
  }
};

module.exports = connectDB;
