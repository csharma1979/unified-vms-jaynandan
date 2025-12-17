const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
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

// Delete all payments
const deleteAllPayments = async () => {
  try {
    // Count existing payments
    const paymentCount = await Payment.countDocuments();
    console.log(`Found ${paymentCount} payment records in the database`);
    
    if (paymentCount === 0) {
      console.log('No payments to delete');
      return;
    }
    
    // Ask for confirmation before deletion
    console.log('\n*** WARNING ***');
    console.log(`This action will permanently delete ALL ${paymentCount} payment records from the database.`);
    console.log('This operation cannot be undone.');
    const answer = await new Promise((resolve) => {
      process.stdout.write('\nDo you want to proceed with deletion? (yes/no): ');
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (text) => {
        process.stdin.pause();
        resolve(text.trim().toLowerCase());
      });
    });
    
    if (answer !== 'yes' && answer !== 'y') {
      console.log('Operation cancelled by user.');
      return;
    }
    
    // Delete all payments
    console.log('\nDeleting all payment records...');
    const result = await Payment.deleteMany({});
    
    console.log(`Successfully deleted ${result.deletedCount} payment records`);
  } catch (error) {
    console.error('Error deleting payments:', error);
  }
};

// Main execution function
const runDeletion = async () => {
  await connectDB();
  
  console.log('=== DELETE ALL PAYMENTS TOOL ===');
  console.log('This tool will delete ALL payment data from the database.\n');
  
  await deleteAllPayments();
  
  console.log('\nDeletion process completed.');
  mongoose.connection.close();
};

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\nProcess interrupted. Closing connections...');
  mongoose.connection.close();
  process.exit(0);
});

// Run the deletion process
if (require.main === module) {
  runDeletion().catch(error => {
    console.error('Unhandled error:', error);
    mongoose.connection.close();
    process.exit(1);
  });
}