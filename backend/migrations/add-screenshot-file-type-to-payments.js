const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

// Import models
const Payment = require('../models/Payment');

console.log('MONGO_URI:', process.env.MONGO_URI);

// MongoDB connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Migration function
const migratePayments = async () => {
  try {
    // Find all payments with screenshotURL but without screenshotFileType
    const payments = await Payment.find({
      screenshotURL: { $exists: true, $ne: null },
      screenshotFileType: { $exists: false }
    });
    
    console.log(`Found ${payments.length} payments to update`);
    
    for (const payment of payments) {
      // For existing records, we'll set a default file type
      // In a real scenario, you might want to check the actual file
      payment.screenshotFileType = 'image/jpeg'; // Default assumption
      await payment.save();
      console.log(`Updated payment ${payment._id}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migratePayments();
  mongoose.connection.close();
};

runMigration();