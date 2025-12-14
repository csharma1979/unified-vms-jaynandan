const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  mode: {
    type: String,
    enum: ['cash', 'transfer', 'upi', 'cheque'],
    required: true
  },
  narration: {
    type: String,
    required: true
  },
  screenshotUrl: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Journal', journalSchema);