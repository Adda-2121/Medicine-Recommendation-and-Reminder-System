const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      // Get user from the token
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
// Grant access only to verified professionals (doctors, laboratorists, radiologists)
exports.verifiedProfessional = (req, res, next) => {
  const professionalRoles = ['doctor', 'laboratorist', 'radiologist'];
  
  if (professionalRoles.includes(req.user.role)) {
    if (req.user.verification_status !== 'verified') {
       return res.status(403).json({
         message: `Access denied. Your account status is: ${req.user.verification_status || 'pending'}. Professionals must be verified by an administrator to perform this action.`,
       });
    }
  }
  next();
};
