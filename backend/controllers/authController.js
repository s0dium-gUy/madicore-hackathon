const User = require('../models/User');
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user (General / Patient)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, name, role, referenceId } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'patient',
      referenceId,
      verificationStatus: 'approved'
    });

    // Generate token
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        referenceId: user.referenceId
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ error: `A user with this ${field} already exists.` });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// @desc    Doctor Signup with file upload
// @route   POST /api/auth/doctor/signup
// @access  Public
exports.doctorSignup = async (req, res) => {
  try {
    const { email, password, name, phone, medicalRegistrationNumber, specialization, availabilitySchedule } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload your medical license document.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate reference ID for doctor
    const docId = `DOC-${Math.round(Math.random() * 100000)}`;

    // Create Doctor profile
    await Doctor.create({
      id: docId,
      name,
      specialization: specialization || 'General Medicine',
      status: 'unavailable',
      availabilitySchedule: availabilitySchedule || '09:00-17:00'
    });

    // Create User account
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'doctor',
      referenceId: docId,
      phone,
      medicalRegistrationNumber,
      medicalLicenseDocument: req.file.path,
      verificationStatus: 'approved' // Automatically approve now
    });

    res.status(201).json({
      message: 'Doctor registration successful.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        referenceId: user.referenceId,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ error: `A user with this ${field} already exists.` });
    }
    console.error('Doctor signup error:', error);
    res.status(500).json({ error: 'Server error during doctor signup.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = signToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        referenceId: user.referenceId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
