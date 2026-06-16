const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const memoryDb = require('../config/memoryDb');

// Helper to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'shopez_stock_secret_key_2026_neon_cyber', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (global.useMemoryDB) {
      const emailExists = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      const usernameExists = memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (emailExists || usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username or Email is already registered'
        });
      }

      // Determine role
      const isFirstUser = memoryDb.users.length === 0;
      const isEmailAdmin = email.toLowerCase().endsWith('@admin.com');
      const role = (isFirstUser || isEmailAdmin) ? 'ADMIN' : 'USER';

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = {
        _id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        username,
        email,
        password: hashedPassword,
        role,
        cashBalance: 10000.00,
        createdAt: new Date()
      };

      memoryDb.users.push(user);

      return res.status(201).json({
        success: true,
        token: signToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          cashBalance: user.cashBalance
        }
      });
    }

    // Standard MongoDB Logic
    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (emailExists || usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username or Email is already registered'
      });
    }

    const isFirstUser = (await User.countDocuments()) === 0;
    const isEmailAdmin = email.toLowerCase().endsWith('@admin.com');
    const role = (isFirstUser || isEmailAdmin) ? 'ADMIN' : 'USER';

    const user = await User.create({
      username,
      email,
      password,
      role,
      cashBalance: 10000.00
    });

    res.status(201).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        cashBalance: user.cashBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (global.useMemoryDB) {
      const user = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      return res.json({
        success: true,
        token: signToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          cashBalance: user.cashBalance
        }
      });
    }

    // MongoDB Logic
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        cashBalance: user.cashBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile & total portfolio worth
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const user = memoryDb.users.find(u => u._id === req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const holdings = memoryDb.portfolios.filter(p => p.userId === user._id);
      let totalPortfolioValue = 0;

      for (const holding of holdings) {
        const stock = memoryDb.stocks.find(s => s.symbol === holding.stockSymbol);
        if (stock) {
          totalPortfolioValue += holding.quantity * stock.currentPrice;
        }
      }

      return res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          cashBalance: user.cashBalance,
          portfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
          totalNetWorth: parseFloat((user.cashBalance + totalPortfolioValue).toFixed(2))
        }
      });
    }

    // MongoDB Logic
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const holdings = await Portfolio.find({ user: user._id });
    let totalPortfolioValue = 0;

    for (const holding of holdings) {
      const stock = await Stock.findOne({ symbol: holding.stockSymbol });
      if (stock) {
        totalPortfolioValue += holding.quantity * stock.currentPrice;
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        cashBalance: user.cashBalance,
        portfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
        totalNetWorth: parseFloat((user.cashBalance + totalPortfolioValue).toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
