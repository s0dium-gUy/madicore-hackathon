const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

    let user = await User.findById(decoded.id);
    if (!user) {
      const patient = await Patient.findById(decoded.id);
      if (patient) {
        user = {
          _id: patient._id,
          id: patient._id,
          name: patient.fullName,
          role: 'patient',
          referenceId: patient.id
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

// Grant access to specific roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};
