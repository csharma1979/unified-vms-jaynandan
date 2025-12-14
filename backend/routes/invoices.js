const express = require('express');
const mongoose = require('mongoose');
const { auth, adminAuth } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Company = require('../models/Company');
const Location = require('../models/Location');

const router = express.Router();

// Helper function to generate invoice number
const generateInvoiceNo = () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}${day}-${random}`;
};

// Create a new invoice (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { companyId, locationId, amount, gst, description } = req.body;

    // Validate company and location
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).send({ error: 'Company not found' });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).send({ error: 'Location not found' });
    }

    // Generate unique invoice number
    let invoiceNo;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 5) {
      invoiceNo = generateInvoiceNo();
      const existingInvoice = await Invoice.findOne({ invoiceNo });
      if (!existingInvoice) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).send({ error: 'Could not generate unique invoice number' });
    }

    // Create invoice
    const invoice = new Invoice({
      invoiceNo,
      companyId,
      locationId,
      amount,
      gst,
      description,
      status: 'draft',
      history: [{
        status: 'draft',
        timestamp: new Date(),
        updatedBy: req.user._id
      }]
    });

    await invoice.save();

    // Populate references
    await invoice.populate('companyId locationId');

    res.status(201).send(invoice);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get all invoices (Admin and Agents)
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    // Agents can only see invoices for their location
    if (req.user.role === 'agent') {
      filter.locationId = req.user.locationId;
    }

    const invoices = await Invoice.find(filter)
      .populate('companyId', 'name')
      .populate('locationId', 'name')
      .sort({ createdAt: -1 });

    res.send(invoices);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get a specific invoice (Admin and Agents)
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('companyId', 'name')
      .populate('locationId', 'name');

    if (!invoice) {
      return res.status(404).send({ error: 'Invoice not found' });
    }

    // Agents can only access invoices for their location
    if (req.user.role === 'agent' && invoice.locationId._id.toString() !== req.user.locationId.toString()) {
      return res.status(403).send({ error: 'Access denied' });
    }

    res.send(invoice);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update invoice status (Admin and Agents)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'approved', 'in_progress', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).send({ error: 'Invalid status' });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).send({ error: 'Invoice not found' });
    }

    // Agents can only access invoices for their location
    if (req.user.role === 'agent' && invoice.locationId.toString() !== req.user.locationId.toString()) {
      return res.status(403).send({ error: 'Access denied' });
    }

    // Add to history
    invoice.history.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    invoice.status = status;
    await invoice.save();

    // Populate references
    await invoice.populate('companyId', 'name');
    await invoice.populate('locationId', 'name');

    res.send(invoice);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Update invoice details (Admin only)
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('companyId', 'name')
    .populate('locationId', 'name');

    if (!invoice) {
      return res.status(404).send({ error: 'Invoice not found' });
    }

    res.send(invoice);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Delete an invoice (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).send({ error: 'Invoice not found' });
    }

    res.send(invoice);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;