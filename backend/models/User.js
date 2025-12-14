const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['admin', 'agent'],
    required: true
  },
  mobileNo: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);