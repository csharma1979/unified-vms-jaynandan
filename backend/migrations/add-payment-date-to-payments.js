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
    // Find all payments with status 'paid' but without paymentDate
    const payments = await Payment.find({
      status: 'paid',
      paymentDate: { $exists: false }
    });
    
    console.log(`Found ${payments.length} paid payments to update`);
    
    for (const payment of payments) {
      // Set paymentDate to the current date for existing paid payments
      // In a real scenario, you might want to use the updatedAt or createdAt date
      payment.paymentDate = new Date();
      await payment.save();
      console.log(`Updated payment ${payment._id} with payment date`);
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