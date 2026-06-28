const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const sendEmail = require('../utils/sendEmail');
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

    // Strict email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Registration failed. Please provide a valid email address format." });
    }

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
    const { email: rawEmail, password } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const email = rawEmail.trim().toLowerCase();

    // First check if user exists as an admin or doctor
    let user = await User.findOne({ email, role: { $in: ['admin', 'doctor'] } }).select('+password');
    let isPatientFallback = false;
    let patientObj = null;

    if (!user) {
      // Fallback Patient gateway
      patientObj = await Patient.findOne({ email }).select('+password');
      if (!patientObj) {
        return res.status(404).json({ status: "new_user", message: "Email not registered. Please sign up as a patient." });
      }
      if (!patientObj.isVerified) {
        return res.status(400).json({ error: "Please verify your account first." });
      }
      isPatientFallback = true;
    }

    // Check password
    const hashedPassword = isPatientFallback ? patientObj.password : user.password;
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const targetId = isPatientFallback ? patientObj._id : user._id;
    const token = signToken(targetId);

    const userResponse = isPatientFallback ? {
      id: patientObj._id,
      email: patientObj.email,
      name: patientObj.fullName,
      role: 'patient',
      referenceId: patientObj.id
    } : {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      referenceId: user.referenceId
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
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

// @desc    Register a new Patient (OTP signup flow)
// @route   POST /api/auth/patient/signup
// @access  Public
exports.patientSignup = async (req, res) => {
  try {
    const { fullName, age, gender, email, password } = req.body;

    // Strict validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Registration failed. Please provide a valid email address format." });
    }

    if (!fullName || !age || !gender || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if email already exists in User or Patient collection
    const userExists = await User.findOne({ email });
    const patientExists = await Patient.findOne({ email });
    if (userExists || patientExists) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    // Persist Patient in MongoDB in unverified state
    const patient = await Patient.create({
      fullName,
      age,
      gender,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpires
    });

    // Console log the OTP for easy debugging
    console.log(`[MediCore OTP Debug] OTP for ${email}: ${otp}`);

    // Dispatch OTP using the email notification service
    try {
      await sendEmail({
        to: email.trim(),
        subject: "MediCore Verification OTP",
        text: `Welcome to MediCore! Your 6-digit verification code is: ${otp}. It is valid for 15 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #6366f1;">Welcome to MediCore</h2>
            <p>Please verify your email address to complete your registration.</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; margin: 20px 0;">${otp}</p>
            <p style="font-size: 12px; color: #6b7280;">This code is valid for exactly 15 minutes.</p>
          </div>
        `
      });
    } catch (mailError) {
      console.error("Mail dispatch failed, rolling back document persistence:", mailError);
      // Rollback step to prevent ghost entries
      await Patient.findByIdAndDelete(patient._id);
      return res.status(500).json({ error: "Failed to send verification email. Please check if your email is valid." });
    }

    res.status(201).json({
      message: "Signup successful. OTP has been sent to your email.",
      email: patient.email
    });
  } catch (error) {
    console.error("Patient signup error:", error);
    res.status(500).json({ error: "Server error during patient signup." });
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const patient = await Patient.findOne({ email: email.trim().toLowerCase() });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    // Verify OTP match and expiry
    if (patient.otp !== otp || Date.now() > patient.otpExpires) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Transition state
    patient.isVerified = true;
    patient.otp = null;
    patient.otpExpires = null;
    await patient.save();

    const token = signToken(patient._id);

    res.status(200).json({
      message: "Verification successful.",
      token,
      user: {
        id: patient._id,
        email: patient.email,
        name: patient.fullName,
        role: "patient",
        referenceId: patient.id
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Server error during OTP verification." });
  }
};
