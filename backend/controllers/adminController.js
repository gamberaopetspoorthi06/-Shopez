const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');
const memoryDb = require('../config/memoryDb');

// @desc    Get dashboard analytics for system-wide statistics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const totalUsers = memoryDb.users.length;
      const totalTrades = memoryDb.transactions.length;

      // Calculate total trade volume ($)
      const totalVolume = parseFloat(memoryDb.transactions.reduce((acc, t) => acc + t.totalAmount, 0).toFixed(2));

      // Calculate global assets cash vs equity
      const totalCashInSystem = parseFloat(memoryDb.users.reduce((acc, u) => acc + u.cashBalance, 0).toFixed(2));

      let totalEquityInSystem = 0;
      for (const h of memoryDb.portfolios) {
        const stock = memoryDb.stocks.find(s => s.symbol === h.stockSymbol);
        if (stock) {
          totalEquityInSystem += h.quantity * stock.currentPrice;
        }
      }
      totalEquityInSystem = parseFloat(totalEquityInSystem.toFixed(2));

      // Calculate popular stocks
      const stockTradeCounts = {};
      for (const t of memoryDb.transactions) {
        stockTradeCounts[t.stockSymbol] = (stockTradeCounts[t.stockSymbol] || 0) + 1;
      }

      const popularStocks = Object.keys(stockTradeCounts).map(sym => ({
        symbol: sym,
        count: stockTradeCounts[sym]
      })).sort((a, b) => b.count - a.count).slice(0, 5);

      return res.json({
        success: true,
        analytics: {
          totalUsers,
          totalTrades,
          totalVolume,
          totalCashInSystem,
          totalEquityInSystem,
          totalAssets: parseFloat((totalCashInSystem + totalEquityInSystem).toFixed(2)),
          popularStocks
        }
      });
    }

    // MongoDB Logic
    const totalUsers = await User.countDocuments();
    const totalTrades = await Transaction.countDocuments();

    const transactions = await Transaction.find();
    const totalVolume = parseFloat(transactions.reduce((acc, t) => acc + t.totalAmount, 0).toFixed(2));

    const users = await User.find();
    const totalCashInSystem = parseFloat(users.reduce((acc, u) => acc + u.cashBalance, 0).toFixed(2));

    const holdings = await Portfolio.find();
    let totalEquityInSystem = 0;
    for (const h of holdings) {
      const stock = await Stock.findOne({ symbol: h.stockSymbol });
      if (stock) {
        totalEquityInSystem += h.quantity * stock.currentPrice;
      }
    }
    totalEquityInSystem = parseFloat(totalEquityInSystem.toFixed(2));

    const stockTradeCounts = {};
    for (const t of transactions) {
      stockTradeCounts[t.stockSymbol] = (stockTradeCounts[t.stockSymbol] || 0) + 1;
    }

    const popularStocks = Object.keys(stockTradeCounts).map(sym => ({
      symbol: sym,
      count: stockTradeCounts[sym]
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalTrades,
        totalVolume,
        totalCashInSystem,
        totalEquityInSystem,
        totalAssets: parseFloat((totalCashInSystem + totalEquityInSystem).toFixed(2)),
        popularStocks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of all users and their portfolio values
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const userData = memoryDb.users.map(user => {
        const holdings = memoryDb.portfolios.filter(p => p.userId === user._id);
        let portfolioValue = 0;

        for (const h of holdings) {
          const stock = memoryDb.stocks.find(s => s.symbol === h.stockSymbol);
          if (stock) {
            portfolioValue += h.quantity * stock.currentPrice;
          }
        }

        return {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          cashBalance: user.cashBalance,
          portfolioValue: parseFloat(portfolioValue.toFixed(2)),
          createdAt: user.createdAt
        };
      }).sort((a, b) => a.username.localeCompare(b.username));

      return res.json({ success: true, count: userData.length, data: userData });
    }

    // MongoDB Logic
    const users = await User.find().sort({ username: 1 });
    const userData = [];

    for (const user of users) {
      const holdings = await Portfolio.find({ user: user._id });
      let portfolioValue = 0;

      for (const h of holdings) {
        const stock = await Stock.findOne({ symbol: h.stockSymbol });
        if (stock) {
          portfolioValue += h.quantity * stock.currentPrice;
        }
      }

      userData.push({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        cashBalance: user.cashBalance,
        portfolioValue: parseFloat(portfolioValue.toFixed(2)),
        createdAt: user.createdAt
      });
    }

    res.json({ success: true, count: userData.length, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!role || !['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid role (USER or ADMIN)' });
  }

  try {
    if (global.useMemoryDB) {
      const user = memoryDb.users.find(u => u._id === req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.role = role;
      return res.json({ success: true, message: `Successfully updated role for ${user.username} to ${role}`, data: user });
    }

    // MongoDB Logic
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: `Successfully updated role for ${user.username} to ${role}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user completely (cascades)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const userIndex = memoryDb.users.findIndex(u => u._id === req.params.id);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const username = memoryDb.users[userIndex].username;

      // Cascade wipe holdings and trades
      memoryDb.portfolios = memoryDb.portfolios.filter(p => p.userId !== req.params.id);
      memoryDb.transactions = memoryDb.transactions.filter(t => t.userId !== req.params.id);
      
      // Delete user
      memoryDb.users.splice(userIndex, 1);

      return res.json({ success: true, message: `Successfully deleted user ${username} and their trading history` });
    }

    // MongoDB Logic
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await Portfolio.deleteMany({ user: user._id });
    await Transaction.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({ success: true, message: `Successfully deleted user ${user.username} and their trading history` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new stock listing
// @route   POST /api/admin/stocks
// @access  Private/Admin
exports.createStock = async (req, res) => {
  const { symbol, name, startingPrice } = req.body;

  if (!symbol || !name || !startingPrice || parseFloat(startingPrice) <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a unique symbol, company name, and starting price > 0' });
  }

  try {
    const uppercaseSymbol = symbol.toUpperCase();

    if (global.useMemoryDB) {
      const symbolExists = memoryDb.stocks.find(s => s.symbol === uppercaseSymbol);
      if (symbolExists) {
        return res.status(400).json({ success: false, message: `Stock listing with symbol ${uppercaseSymbol} already exists` });
      }

      const price = parseFloat(startingPrice);
      const stock = {
        _id: `stock_${Date.now()}`,
        symbol: uppercaseSymbol,
        name,
        currentPrice: price,
        openingPrice: price,
        dailyHigh: price,
        dailyLow: price,
        change: 0,
        changePercent: 0,
        history: [{ price, timestamp: new Date() }],
        lastUpdated: new Date()
      };

      memoryDb.stocks.push(stock);

      return res.status(201).json({ success: true, message: `Stock listing for ${stock.symbol} successfully created!`, data: stock });
    }

    // MongoDB Logic
    const symbolExists = await Stock.findOne({ symbol: uppercaseSymbol });
    if (symbolExists) {
      return res.status(400).json({ success: false, message: `Stock listing with symbol ${uppercaseSymbol} already exists` });
    }

    const price = parseFloat(startingPrice);
    const history = [{ price, timestamp: new Date() }];

    const stock = await Stock.create({
      symbol: uppercaseSymbol,
      name,
      currentPrice: price,
      openingPrice: price,
      dailyHigh: price,
      dailyLow: price,
      history
    });

    res.status(201).json({ success: true, message: `Stock listing for ${stock.symbol} successfully created!`, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete stock listing
// @route   DELETE /api/admin/stocks/:symbol
// @access  Private/Admin
exports.deleteStock = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    if (global.useMemoryDB) {
      const stockIndex = memoryDb.stocks.findIndex(s => s.symbol === symbol);
      if (stockIndex === -1) {
        return res.status(404).json({ success: false, message: `Stock ${symbol} not found` });
      }

      memoryDb.stocks.splice(stockIndex, 1);
      return res.json({ success: true, message: `Successfully removed stock ${symbol} from the system` });
    }

    // MongoDB Logic
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock ${symbol} not found` });
    }

    await Stock.deleteOne({ _id: stock._id });
    res.json({ success: true, message: `Successfully removed stock ${symbol} from the system` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all transactions across entire platform
// @route   GET /api/admin/trades
// @access  Private/Admin
exports.getAllTrades = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const trades = memoryDb.transactions.map(t => {
        const matchingUser = memoryDb.users.find(u => u._id === t.userId);
        return {
          ...t,
          user: matchingUser ? { _id: matchingUser._id, username: matchingUser.username, email: matchingUser.email } : null
        };
      }).sort((a, b) => b.timestamp - a.timestamp);

      return res.json({ success: true, count: trades.length, data: trades });
    }

    // MongoDB Logic
    const trades = await Transaction.find()
      .populate('user', 'username email')
      .sort({ timestamp: -1 });

    res.json({ success: true, count: trades.length, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
