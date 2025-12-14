const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Journal = require('../models/Journal');
const upload = require('../utils/upload');

const router = express.Router();

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send({ error: 'File size exceeds 5MB limit' });
    }
    if (err.message === 'Only image files are allowed!') {
      return res.status(400).send({ error: 'Only image files (JPG, JPEG, PNG) are allowed' });
    }
    return res.status(400).send({ error: err.message });
  }
  next();
};

// Create a journal entry (Admin only) with file upload
router.post('/', adminAuth, upload.single('paymentEvidence'), handleMulterError, async (req, res) => {
  try {
    const { name, amount, mode, narration } = req.body;
    
    // Handle screenshot URL from either uploaded file or manual input
    let screenshotUrl = req.body.screenshotUrl || '';
    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    // Create journal entry
    const journalEntry = new Journal({
      name,
      amount,
      mode,
      narration,
      screenshotUrl,
      createdBy: req.user._id
    });

    await journalEntry.save();

    // Populate references
    await journalEntry.populate('createdBy', 'mobileNo');

    res.status(201).send(journalEntry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).send({ error: error.message });
  }
});

// Get all journal entries (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const journalEntries = await Journal.find({})
      .populate('createdBy', 'mobileNo')
      .sort({ createdAt: -1 });

    res.send(journalEntries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).send({ error: error.message });
  }
});

// Get a specific journal entry (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const journalEntry = await Journal.findById(req.params.id)
      .populate('createdBy', 'mobileNo');

    if (!journalEntry) {
      return res.status(404).send({ error: 'Journal entry not found' });
    }

    res.send(journalEntry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).send({ error: error.message });
  }
});

// Update a journal entry (Admin only) with file upload
router.patch('/:id', adminAuth, upload.single('paymentEvidence'), handleMulterError, async (req, res) => {
  try {
    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle screenshot URL from either uploaded file or manual input
    if (req.file) {
      updateData.screenshotUrl = `/uploads/${req.file.filename}`;
    }

    const journalEntry = await Journal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'mobileNo');

    if (!journalEntry) {
      return res.status(404).send({ error: 'Journal entry not found' });
    }

    res.send(journalEntry);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).send({ error: error.message });
  }
});

// Delete a journal entry (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const journalEntry = await Journal.findByIdAndDelete(req.params.id);

    if (!journalEntry) {
      return res.status(404).send({ error: 'Journal entry not found' });
    }

    res.send(journalEntry);
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;