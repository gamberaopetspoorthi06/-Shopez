const jwt = require('jsonwebtoken');
const User = require('../models/User');
const memoryDb = require('../config/memoryDb');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopez_stock_secret_key_2026_neon_cyber');

      // Check if we are running in-memory or on MongoDB
      if (global.useMemoryDB) {
        const memoryUser = memoryDb.users.find(u => u._id === decoded.id);
        if (!memoryUser) {
          return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }
        // Exclude password
        const { password, ...userWithoutPassword } = memoryUser;
        req.user = userWithoutPassword;
      } else {
        // Get user from MongoDB
        req.user = await User.findById(decoded.id).select('-password');
      }
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
