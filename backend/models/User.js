const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Do not return password by default
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'patient'],
    required: true
  },
  // Reference to the specific role document (Doctor or Patient)
  referenceId: {
    type: String, // Storing as String to match existing ID format (e.g., DOC-101)
    default: null
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  medicalRegistrationNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  medicalLicenseDocument: {
    type: String,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
