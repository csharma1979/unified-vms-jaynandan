const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const Company = require('../models/Company');
const Location = require('../models/Location');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Journal = require('../models/Journal');
const csv = require('csv-stringify');
const archiver = require('archiver');
const stream = require('stream');

// Helper function to convert MongoDB documents to CSV
const collectionToCSV = (collection, modelName) => {
  return new Promise((resolve, reject) => {
    if (!collection || collection.length === 0) {
      return resolve('');
    }

    // Convert ObjectId fields to strings for better CSV representation
    const sanitizedCollection = collection.map(doc => {
      const sanitizedDoc = { ...doc.toObject() };
      for (const key in sanitizedDoc) {
        if (sanitizedDoc[key] instanceof Date) {
          sanitizedDoc[key] = sanitizedDoc[key].toISOString();
        } else if (typeof sanitizedDoc[key] === 'object' && sanitizedDoc[key] !== null) {
          if (sanitizedDoc[key].toString) {
            sanitizedDoc[key] = sanitizedDoc[key].toString();
          } else {
            sanitizedDoc[key] = JSON.stringify(sanitizedDoc[key]);
          }
        }
      }
      return sanitizedDoc;
    });

    const columns = Object.keys(sanitizedCollection[0]);
    const stringifier = csv.stringify({
      header: true,
      columns: columns,
      quoted: true
    });

    const chunks = [];
    stringifier.on('data', chunk => chunks.push(chunk));
    stringifier.on('end', () => resolve(Buffer.concat(chunks).toString()));
    stringifier.on('error', err => reject(err));

    sanitizedCollection.forEach(row => stringifier.write(row));
    stringifier.end();
  });
};

// Export all database collections as CSV files in a ZIP archive
router.get('/database', adminAuth, async (req, res) => {
  try {
    // Fetch all collections in parallel
    const [
      companies,
      locations,
      users,
      invoices,
      payments,
      journals
    ] = await Promise.all([
      Company.find({}),
      Location.find({}).populate('companyId userId'),
      User.find({}),
      Invoice.find({}).populate('companyId locationId'),
      Payment.find({}).populate('createdBy'),
      Journal.find({}).populate('createdBy')
    ]);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set headers for ZIP file download
    res.attachment('database_export.zip');
    archive.pipe(res);

    // Add each collection as a CSV file to the archive
    const collections = [
      { data: companies, name: 'companies.csv' },
      { data: locations, name: 'locations.csv' },
      { data: users, name: 'users.csv' },
      { data: invoices, name: 'invoices.csv' },
      { data: payments, name: 'payments.csv' },
      { data: journals, name: 'journals.csv' }
    ];

    // Process each collection and add to archive
    for (const collection of collections) {
      const csvData = await collectionToCSV(collection.data, collection.name.replace('.csv', ''));
      archive.append(csvData, { name: collection.name });
    }

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Database export error:', error);
    res.status(500).send({ error: 'Failed to export database: ' + error.message });
  }
});

module.exports = router;