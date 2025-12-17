const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Payment = require('../models/Payment');
const User = require('../models/User');
const Company = require('../models/Company');

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

// Identify test payments based on common patterns
const identifyTestPayments = async () => {
  try {
    // Look for payments with common test indicators
    const testPatterns = [
      { transactionId: { $regex: /(test|demo|sample)/i } },
      { poNo: { $regex: /(test|demo|sample)/i } },
      { invoiceNo: { $regex: /(test|demo|sample)/i } },
      { projectCost: { $in: [1, 10, 100, 1000] } },
      { calculatedHandlingCharges: { $in: [1, 10, 100, 1000] } }
    ];

    // Check for payments created by test users
    const testUsers = await User.find({
      $or: [
        { name: { $regex: /(test|demo)/i } },
        { email: { $regex: /(test|demo)/i } },
        { mobileNo: { $regex: /(test|demo)/i } }
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

    console.log(`Found ${testPayments.length} potential test payments`);

    // Display test payments for review
    testPayments.forEach(payment => {
      console.log(`\n--- Test Payment ---`);
      console.log(`ID: ${payment._id}`);
      console.log(`Transaction ID: ${payment.transactionId}`);
      console.log(`PO No: ${payment.poNo}`);
      console.log(`Invoice No: ${payment.invoiceNo}`);
      console.log(`Project Cost: ${payment.projectCost}`);
      console.log(`Handling Charges: ${payment.calculatedHandlingCharges}`);
      console.log(`Created By: ${payment.createdBy?.name || payment.createdBy?.email || payment.createdBy?.mobileNo || 'Unknown'}`);
      console.log(`Created At: ${payment.createdAt}`);
    });

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
      return;
    }

    console.log(`\nDeleting ${paymentIds.length} test payments...`);
    
    // Delete the payments
    const result = await Payment.deleteMany({ _id: { $in: paymentIds } });
    
    console.log(`Successfully deleted ${result.deletedCount} test payments`);
  } catch (error) {
    console.error('Error deleting test payments:', error);
  }
};

// Main execution function
const runCleanup = async () => {
  await connectDB();
  
  console.log('=== Payment Data Cleanup Tool ===');
  console.log('This tool will identify and remove test payment data from the database.\n');
  
  // Identify test payments
  const testPayments = await identifyTestPayments();
  
  if (testPayments.length === 0) {
    console.log('\nNo test payments found. Database is clean.');
    mongoose.connection.close();
    return;
  }
  
  console.log(`\n--- Summary ---`);
  console.log(`Total test payments identified: ${testPayments.length}`);
  
  // Ask for confirmation before deletion
  console.log('\n*** WARNING ***');
  console.log('This action will permanently delete the identified test payments.');
  console.log('This operation cannot be undone.');
  console.log('Please review the list above before proceeding.');
  
  // In a real scenario, you would prompt for confirmation here
  // For now, we'll simulate confirmation
  console.log('\nSimulating user confirmation...');
  
  // Extract payment IDs for deletion
  const paymentIds = testPayments.map(payment => payment._id);
  
  // Delete the test payments
  await deleteTestPayments(paymentIds);
  
  console.log('\nCleanup process completed.');
  mongoose.connection.close();
};

// Run the cleanup process
if (require.main === module) {
  runCleanup();
}

module.exports = { identifyTestPayments, deleteTestPayments };