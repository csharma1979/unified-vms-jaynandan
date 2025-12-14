const express = require('express');
const mongoose = require('mongoose');
const { auth, adminAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const Location = require('../models/Location');
const User = require('../models/User');
const upload = require('../utils/upload');
const csv = require('csv-stringify');

const router = express.Router();

// Export payments data as CSV (Admin and Agents)
router.get('/export', auth, async (req, res) => {
  try {
    let filter = {};
    
    // Agents can only export payments they created
    if (req.user.role === 'agent') {
      filter.createdBy = req.user._id;
    }
    
    // Get all payments without pagination
    const payments = await Payment.find(filter)
      .populate({
        path: 'createdBy',
        select: 'mobileNo companyId locationId',
        populate: [
          {
            path: 'locationId',
            select: 'name address email contactPerson contactMobile companyId'
          },
          {
            path: 'companyId',
            select: 'name phone email'
          }
        ]
      })
      .sort({ createdAt: -1 });
    
    // Prepare data for CSV
    const csvData = [];
    
    // Add header row
    csvData.push([
      'Company Name', 'Company ID', 'Company Phone', 'Company Email',
      'Location Name', 'Location ID', 'Location Address', 'Location Email', 'Location City', 'Location State',
      'Contact Person Name', 'Contact Email', 'Contact Mobile',
      'Invoice Number', 'Payment ID', 'Payment Amount', 'Payment Status', 'Payment Mode',
      'Transaction Reference', 'Payment Date', 'Created Date', 'Updated Date'
    ]);
    
    // Process each payment
    for (const payment of payments) {
      const company = payment.createdBy?.companyId || {};
      const location = payment.createdBy?.locationId || {};
      
      csvData.push([
        company.name || '',
        company._id || '',
        company.phone || '',
        company.email || '',
        location.name || '',
        location._id || '',
        location.address || '',
        location.email || '',
        '', // City - not in current model
        '', // State - not in current model
        location.contactPerson || '',
        location.email || '', // Contact Email
        location.contactMobile || '',
        payment.invoiceNo || '',
        payment._id.toString(),
        payment.calculatedHandlingCharges || '',
        payment.status || '',
        payment.transactionType || '',
        payment.transactionId || '',
        payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
        payment.createdAt ? new Date(payment.createdAt).toISOString().split('T')[0] : '',
        payment.updatedAt ? new Date(payment.updatedAt).toISOString().split('T')[0] : ''
      ]);
    }
    
    // Generate filename based on user role
    const dateStr = new Date().toISOString().split('T')[0];
    let filename;
    
    if (req.user.role === 'admin') {
      filename = `payments_export_all_companies_${dateStr}.csv`;
    } else {
      // For agent, get company and location names
      const agentCompany = payments[0]?.createdBy?.companyId?.name || 'company';
      const agentLocation = payments[0]?.createdBy?.locationId?.name || 'location';
      // Sanitize filename by replacing spaces and special characters
      const companyName = agentCompany.replace(/[^a-zA-Z0-9]/g, '_');
      const locationName = agentLocation.replace(/[^a-zA-Z0-9]/g, '_');
      filename = `payments_export_${companyName}_${locationName}_${dateStr}.csv`;
    }
    
    // Convert to CSV
    csv.stringify(csvData, (err, output) => {
      if (err) {
        return res.status(500).send({ error: 'Failed to generate CSV: ' + err.message });
      }
      
      // Set headers for CSV download
      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      res.send(output);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send({ error: 'Failed to export payments data: ' + error.message });
  }
});

// Helper function to generate transaction ID
const generateTransactionId = (invoiceNo, transactionType) => {
  const timestamp = Math.floor(Date.now() / 1000);
  return `TX-${invoiceNo}-${transactionType.toUpperCase()}-${timestamp}`;
};

// Create a payment request (Agents only)
router.post('/', auth, async (req, res) => {
  try {
    // Only agents can create payment requests
    if (req.user.role !== 'agent') {
      return res.status(403).send({ error: 'Access denied. Agents only.' });
    }

    const { 
      transactionType, 
      poNo, 
      invoiceNo, 
      projectCost, 
      handlingChargesPercentage, 
      calculatedHandlingCharges, 
      instructions 
    } = req.body;

    // Calculate handling charges if not provided
    let finalCalculatedHandlingCharges = calculatedHandlingCharges;
    if (projectCost && handlingChargesPercentage && !calculatedHandlingCharges) {
      finalCalculatedHandlingCharges = (projectCost * handlingChargesPercentage) / 100;
    }

    // Generate transaction ID
    const transactionId = generateTransactionId(invoiceNo || 'NOINV', transactionType);

    // Create payment
    const payment = new Payment({
      transactionType,
      transactionId,
      poNo,
      invoiceNo,
      projectCost,
      handlingChargesPercentage,
      calculatedHandlingCharges: finalCalculatedHandlingCharges,
      instructions,
      createdBy: req.user._id,
      status: 'pending'
    });

    await payment.save();

    // Populate references
    await payment.populate('createdBy', 'mobileNo');

    res.status(201).send(payment);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get all payment requests (Admin and Agents) with search, filter, pagination support
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    // Agents can only see payments they created
    if (req.user.role === 'agent') {
      filter.createdBy = req.user._id;
    }
    
    // Search and filter parameters
    const {
      search,
      status,
      transactionType,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { poNo: { $regex: search, $options: 'i' } },
        { invoiceNo: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply status filter
    if (status) {
      filter.status = status;
    }
    
    // Apply transaction type filter
    if (transactionType) {
      filter.transactionType = transactionType;
    }
    
    // Apply date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get filtered payments with pagination
    const payments = await Payment.find(filter)
      .populate({
        path: 'createdBy',
        select: 'mobileNo',
        populate: {
          path: 'locationId',
          select: 'contactPerson'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const totalPayments = await Payment.countDocuments(filter);
    
    // Calculate total payment amount for current filters
    const paymentAggregation = await Payment.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: "$calculatedHandlingCharges" }
        }
      }
    ]);
    
    const totalAmount = paymentAggregation.length > 0 ? paymentAggregation[0].totalAmount : 0;
    
    res.send({
      payments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalPayments / limitNum),
        totalPayments,
        hasNext: pageNum < Math.ceil(totalPayments / limitNum),
        hasPrev: pageNum > 1
      },
      totalAmount
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get a specific payment request (Admin and Agents)
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'mobileNo',
        populate: {
          path: 'locationId',
          select: 'contactPerson'
        }
      });

    if (!payment) {
      return res.status(404).send({ error: 'Payment not found' });
    }

    // Agents can only access payments they created
    if (req.user.role === 'agent' && payment.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Access denied' });
    }

    res.send(payment);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update payment status with screenshot upload (Admin only)
router.patch('/:id/status', adminAuth, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'paid'];

    if (!validStatuses.includes(status)) {
      return res.status(400).send({ error: 'Invalid status' });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).send({ error: 'Payment not found' });
    }

    payment.status = status;
    if (adminRemarks) {
      payment.adminRemarks = adminRemarks;
    }
    
    // If status is paid, set the payment date
    if (status === 'paid') {
      payment.paymentDate = new Date();
      
      // If screenshot is uploaded, save it
      if (req.file) {
        payment.screenshotURL = `/uploads/${req.file.filename}`;
        payment.screenshotFileType = req.file.mimetype;
      }
    }

    await payment.save();

    // Populate references
    await payment.populate({
      path: 'createdBy',
      select: 'mobileNo',
      populate: {
        path: 'locationId',
        select: 'contactPerson'
      }
    });

    res.send(payment);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Admin can delete a payment request only if it's pending
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).send({ error: 'Payment not found' });
    }

    // Only pending payments can be deleted
    if (payment.status !== 'pending') {
      return res.status(400).send({ error: 'Only pending payments can be deleted' });
    }

    await payment.remove();
    res.send(payment);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;