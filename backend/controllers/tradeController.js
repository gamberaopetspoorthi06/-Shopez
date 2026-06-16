const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const memoryDb = require('../config/memoryDb');

// @desc    Buy a stock
// @route   POST /api/trades/buy
// @access  Private
exports.buyStock = async (req, res) => {
  let { symbol, quantity } = req.body;
  quantity = parseInt(quantity);

  if (!symbol || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid stock symbol and positive quantity' });
  }

  try {
    if (global.useMemoryDB) {
      const user = memoryDb.users.find(u => u._id === req.user.id);
      const stock = memoryDb.stocks.find(s => s.symbol === symbol.toUpperCase());

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (!stock) {
        return res.status(404).json({ success: false, message: `Stock with symbol ${symbol} not found` });
      }

      const totalCost = parseFloat((stock.currentPrice * quantity).toFixed(2));

      if (user.cashBalance < totalCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient funds. Total cost is $${totalCost.toLocaleString()}, but your cash balance is $${user.cashBalance.toLocaleString()}`
        });
      }

      // Deduct cash
      user.cashBalance = parseFloat((user.cashBalance - totalCost).toFixed(2));

      // Find or create Portfolio
      let portfolio = memoryDb.portfolios.find(p => p.userId === user._id && p.stockSymbol === stock.symbol);
      if (portfolio) {
        const currentVal = portfolio.quantity * portfolio.averageBuyPrice;
        const totalQty = portfolio.quantity + quantity;
        portfolio.averageBuyPrice = parseFloat(((currentVal + totalCost) / totalQty).toFixed(2));
        portfolio.quantity = totalQty;
      } else {
        portfolio = {
          _id: `portfolio_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId: user._id,
          stockSymbol: stock.symbol,
          quantity,
          averageBuyPrice: stock.currentPrice
        };
        memoryDb.portfolios.push(portfolio);
      }

      // Log transaction
      const transaction = {
        _id: `tx_${Date.now()}`,
        userId: user._id,
        stockSymbol: stock.symbol,
        type: 'BUY',
        quantity,
        priceAtTrade: stock.currentPrice,
        totalAmount: totalCost,
        timestamp: new Date()
      };
      memoryDb.transactions.push(transaction);

      return res.status(200).json({
        success: true,
        message: `Successfully purchased ${quantity} shares of ${stock.symbol}!`,
        data: {
          cashBalance: user.cashBalance,
          holding: portfolio,
          transaction
        }
      });
    }

    // MongoDB Logic
    const user = await User.findById(req.user.id);
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });

    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock with symbol ${symbol} not found` });
    }

    const totalCost = parseFloat((stock.currentPrice * quantity).toFixed(2));

    if (user.cashBalance < totalCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Total cost is $${totalCost.toLocaleString()}, but your cash balance is $${user.cashBalance.toLocaleString()}`
      });
    }

    user.cashBalance = parseFloat((user.cashBalance - totalCost).toFixed(2));
    await user.save();

    let portfolio = await Portfolio.findOne({ user: user._id, stockSymbol: stock.symbol });

    if (portfolio) {
      const currentVal = portfolio.quantity * portfolio.averageBuyPrice;
      const totalQty = portfolio.quantity + quantity;
      portfolio.averageBuyPrice = parseFloat(((currentVal + totalCost) / totalQty).toFixed(2));
      portfolio.quantity = totalQty;
      await portfolio.save();
    } else {
      portfolio = await Portfolio.create({
        user: user._id,
        stockSymbol: stock.symbol,
        quantity,
        averageBuyPrice: stock.currentPrice
      });
    }

    const transaction = await Transaction.create({
      user: user._id,
      stockSymbol: stock.symbol,
      type: 'BUY',
      quantity,
      priceAtTrade: stock.currentPrice,
      totalAmount: totalCost
    });

    res.status(200).json({
      success: true,
      message: `Successfully purchased ${quantity} shares of ${stock.symbol}!`,
      data: {
        cashBalance: user.cashBalance,
        holding: portfolio,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Sell a stock
// @route   POST /api/trades/sell
// @access  Private
exports.sellStock = async (req, res) => {
  let { symbol, quantity } = req.body;
  quantity = parseInt(quantity);

  if (!symbol || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid stock symbol and positive quantity' });
  }

  try {
    if (global.useMemoryDB) {
      const user = memoryDb.users.find(u => u._id === req.user.id);
      const stock = memoryDb.stocks.find(s => s.symbol === symbol.toUpperCase());

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (!stock) {
        return res.status(404).json({ success: false, message: `Stock with symbol ${symbol} not found` });
      }

      const portfolio = memoryDb.portfolios.find(p => p.userId === user._id && p.stockSymbol === stock.symbol);

      if (!portfolio || portfolio.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient holdings. You only own ${portfolio ? portfolio.quantity : 0} shares of ${stock.symbol}`
        });
      }

      const totalCredit = parseFloat((stock.currentPrice * quantity).toFixed(2));

      // Credit cash
      user.cashBalance = parseFloat((user.cashBalance + totalCredit).toFixed(2));

      // Update Portfolio
      portfolio.quantity -= quantity;
      if (portfolio.quantity === 0) {
        memoryDb.portfolios = memoryDb.portfolios.filter(p => p._id !== portfolio._id);
      }

      // Log transaction
      const transaction = {
        _id: `tx_${Date.now()}`,
        userId: user._id,
        stockSymbol: stock.symbol,
        type: 'SELL',
        quantity,
        priceAtTrade: stock.currentPrice,
        totalAmount: totalCredit,
        timestamp: new Date()
      };
      memoryDb.transactions.push(transaction);

      return res.status(200).json({
        success: true,
        message: `Successfully sold ${quantity} shares of ${stock.symbol}!`,
        data: {
          cashBalance: user.cashBalance,
          remainingHolding: portfolio.quantity > 0 ? portfolio : null,
          transaction
        }
      });
    }

    // MongoDB Logic
    const user = await User.findById(req.user.id);
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });

    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock with symbol ${symbol} not found` });
    }

    const portfolio = await Portfolio.findOne({ user: user._id, stockSymbol: stock.symbol });

    if (!portfolio || portfolio.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient holdings. You only own ${portfolio ? portfolio.quantity : 0} shares of ${stock.symbol}`
      });
    }

    const totalCredit = parseFloat((stock.currentPrice * quantity).toFixed(2));

    user.cashBalance = parseFloat((user.cashBalance + totalCredit).toFixed(2));
    await user.save();

    portfolio.quantity -= quantity;
    if (portfolio.quantity === 0) {
      await Portfolio.deleteOne({ _id: portfolio._id });
    } else {
      await portfolio.save();
    }

    const transaction = await Transaction.create({
      user: user._id,
      stockSymbol: stock.symbol,
      type: 'SELL',
      quantity,
      priceAtTrade: stock.currentPrice,
      totalAmount: totalCredit
    });

    res.status(200).json({
      success: true,
      message: `Successfully sold ${quantity} shares of ${stock.symbol}!`,
      data: {
        cashBalance: user.cashBalance,
        remainingHolding: portfolio.quantity > 0 ? portfolio : null,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user portfolio enriched with live stock prices
// @route   GET /api/trades/portfolio
// @access  Private
exports.getPortfolio = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const holdings = memoryDb.portfolios.filter(p => p.userId === req.user.id);
      const enrichedHoldings = [];

      for (const holding of holdings) {
        const stock = memoryDb.stocks.find(s => s.symbol === holding.stockSymbol);
        if (stock) {
          const currentPrice = stock.currentPrice;
          const marketValue = parseFloat((holding.quantity * currentPrice).toFixed(2));
          const costBasis = parseFloat((holding.quantity * holding.averageBuyPrice).toFixed(2));
          const gainLoss = parseFloat((marketValue - costBasis).toFixed(2));
          const gainLossPercent = costBasis > 0 ? parseFloat(((gainLoss / costBasis) * 100).toFixed(2)) : 0;

          enrichedHoldings.push({
            _id: holding._id,
            stockSymbol: holding.stockSymbol,
            companyName: stock.name,
            quantity: holding.quantity,
            averageBuyPrice: holding.averageBuyPrice,
            currentPrice: currentPrice,
            marketValue,
            costBasis,
            gainLoss,
            gainLossPercent,
            priceChangePercent: stock.changePercent
          });
        }
      }

      return res.json({ success: true, count: enrichedHoldings.length, data: enrichedHoldings });
    }

    // MongoDB Logic
    const holdings = await Portfolio.find({ user: req.user.id });
    const enrichedHoldings = [];

    for (const holding of holdings) {
      const stock = await Stock.findOne({ symbol: holding.stockSymbol });
      if (stock) {
        const currentPrice = stock.currentPrice;
        const marketValue = parseFloat((holding.quantity * currentPrice).toFixed(2));
        const costBasis = parseFloat((holding.quantity * holding.averageBuyPrice).toFixed(2));
        const gainLoss = parseFloat((marketValue - costBasis).toFixed(2));
        const gainLossPercent = costBasis > 0 ? parseFloat(((gainLoss / costBasis) * 100).toFixed(2)) : 0;

        enrichedHoldings.push({
          _id: holding._id,
          stockSymbol: holding.stockSymbol,
          companyName: stock.name,
          quantity: holding.quantity,
          averageBuyPrice: holding.averageBuyPrice,
          currentPrice: currentPrice,
          marketValue,
          costBasis,
          gainLoss,
          gainLossPercent,
          priceChangePercent: stock.changePercent
        });
      }
    }

    res.json({ success: true, count: enrichedHoldings.length, data: enrichedHoldings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get transaction history
// @route   GET /api/trades/history
// @access  Private
exports.getTransactionHistory = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const transactions = memoryDb.transactions
        .filter(t => t.userId === req.user.id)
        .sort((a, b) => b.timestamp - a.timestamp);
        
      return res.json({ success: true, count: transactions.length, data: transactions });
    }

    // MongoDB Logic
    const transactions = await Transaction.find({ user: req.user.id }).sort({ timestamp: -1 });
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
