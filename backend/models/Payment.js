const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['advance', 'invoice_payment', 'final_payment'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  poNo: {
    type: String,
    required: true
  },
  invoiceNo: {
    type: String
  },
  projectCost: {
    type: Number
  },
  handlingChargesPercentage: {
    type: Number
  },
  calculatedHandlingCharges: {
    type: Number
  },
  instructions: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  adminRemarks: {
    type: String
  },
  screenshotURL: {
    type: String
  },
  screenshotFileType: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual property to calculate payable amount
paymentSchema.virtual('payableAmount').get(function() {
  if (this.projectCost && this.calculatedHandlingCharges) {
    const payable = this.projectCost - this.calculatedHandlingCharges;
    return payable > 0 ? payable : 0;
  }
  return 0;
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);