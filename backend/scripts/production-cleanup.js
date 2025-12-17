const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const readline = require('readline');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Create interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Function to ask for user confirmation
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
};

// Identify test payments based on common patterns
const identifyTestPayments = async () => {
  try {
    console.log('Scanning for test payments...');
    
    // Look for payments with common test indicators
    const testPatterns = [
      { transactionId: { $regex: /(test|demo|sample|sandbox)/i } },
      { poNo: { $regex: /(test|demo|sample|sandbox)/i } },
      { invoiceNo: { $regex: /(test|demo|sample|sandbox)/i } },
      { projectCost: { $in: [1, 10, 100, 1000, 0.01, 0.1, 0.99] } },
      { calculatedHandlingCharges: { $in: [1, 10, 100, 1000, 0.01, 0.1, 0.99] } }
    ];

    // Check for payments created by test users
    const testUsers = await User.find({
      $or: [
        { name: { $regex: /(test|demo|sample|sandbox)/i } },
        { email: { $regex: /(test|demo|sample|sandbox)/i } },
        { mobileNo: { $regex: /(test|demo|sample|sandbox)/i } }
      ]
    });

    const testUserIds = testUsers.map(user => user._id);

    // Combine all test criteria
    const testPaymentsFilter = {
      $or: [
        ...testPatterns,
        { createdBy: { $in: testUserIds } }
      ]
    };

    // Find all test payments
    const testPayments = await Payment.find(testPaymentsFilter)
      .populate('createdBy', 'name email mobileNo')
      .sort({ createdAt: -1 });

    console.log(`\nFound ${testPayments.length} potential test payments:`);
    
    if (testPayments.length > 0) {
      // Display sample of test payments for review (first 10)
      const displayCount = Math.min(10, testPayments.length);
      console.log(`\nShowing first ${displayCount} test payments:`);
      
      for (let i = 0; i < displayCount; i++) {
        const payment = testPayments[i];
        console.log(`\n--- Test Payment #${i+1} ---`);
        console.log(`ID: ${payment._id}`);
        console.log(`Transaction ID: ${payment.transactionId}`);
        console.log(`PO No: ${payment.poNo}`);
        console.log(`Invoice No: ${payment.invoiceNo}`);
        console.log(`Project Cost: ₹${payment.projectCost}`);
        console.log(`Handling Charges: ₹${payment.calculatedHandlingCharges}`);
        console.log(`Status: ${payment.status}`);
        console.log(`Created By: ${payment.createdBy?.name || payment.createdBy?.email || payment.createdBy?.mobileNo || 'Unknown'}`);
        console.log(`Created At: ${payment.createdAt}`);
      }
      
      if (testPayments.length > 10) {
        console.log(`\n... and ${testPayments.length - 10} more test payments.`);
      }
    }

    return testPayments;
  } catch (error) {
    console.error('Error identifying test payments:', error);
    return [];
  }
};

// Delete test payments with confirmation
const deleteTestPayments = async (paymentIds) => {
  try {
    if (paymentIds.length === 0) {
      console.log('No payments to delete');
      return { deletedCount: 0 };
    }

    console.log(`\nDeleting ${paymentIds.length} test payments...`);
    
    // Delete the payments
    const result = await Payment.deleteMany({ _id: { $in: paymentIds } });
    
    console.log(`Successfully deleted ${result.deletedCount} test payments`);
    return result;
  } catch (error) {
    console.error('Error deleting test payments:', error);
    return { deletedCount: 0 };
  }
};

// Main execution function
const runProductionCleanup = async () => {
  console.log('=== PRODUCTION PAYMENT DATA CLEANUP TOOL ===');
  console.log('This tool will identify and remove test payment data from the database.');
  console.log('WARNING: This operation cannot be undone. Always backup your database before proceeding.\n');
  
  // Connect to database
  await connectDB();
  
  // Identify test payments
  const testPayments = await identifyTestPayments();
  
  if (testPayments.length === 0) {
    console.log('\nNo test payments found. Database is clean.');
    rl.close();
    mongoose.connection.close();
    return;
  }
  
  console.log(`\n--- SUMMARY ---`);
  console.log(`Total test payments identified: ${testPayments.length}`);
  
  // Ask for confirmation before deletion
  console.log('\n*** WARNING ***');
  console.log('This action will permanently delete the identified test payments.');
  console.log('This operation cannot be undone.');
  console.log('Please review the list above before proceeding.');
  
  const answer = await askQuestion('\nDo you want to proceed with deletion? (yes/no): ');
  
  if (answer !== 'yes' && answer !== 'y') {
    console.log('Operation cancelled by user.');
    rl.close();
    mongoose.connection.close();
    return;
  }
  
  // Extract payment IDs for deletion
  const paymentIds = testPayments.map(payment => payment._id);
  
  // Delete the test payments
  const result = await deleteTestPayments(paymentIds);
  
  console.log(`\nCleanup process completed. Deleted ${result.deletedCount} test payments.`);
  
  // Close connections
  rl.close();
  mongoose.connection.close();
};

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\nProcess interrupted. Closing connections...');
  rl.close();
  mongoose.connection.close();
  process.exit(0);
});

// Run the cleanup process
if (require.main === module) {
  runProductionCleanup().catch(error => {
    console.error('Unhandled error:', error);
    rl.close();
    mongoose.connection.close();
    process.exit(1);
  });
}

module.exports = { identifyTestPayments, deleteTestPayments };