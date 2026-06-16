const Stock = require('../models/Stock');
const memoryDb = require('../config/memoryDb');

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Public
exports.getStocks = async (req, res) => {
  try {
    if (global.useMemoryDB) {
      const stocks = [...memoryDb.stocks].sort((a, b) => a.symbol.localeCompare(b.symbol));
      return res.json({ success: true, count: stocks.length, data: stocks });
    }

    // MongoDB Logic
    const stocks = await Stock.find().sort({ symbol: 1 });
    res.json({ success: true, count: stocks.length, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
exports.getStockBySymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    if (global.useMemoryDB) {
      const stock = memoryDb.stocks.find(s => s.symbol === symbol);
      if (!stock) {
        return res.status(404).json({
          success: false,
          message: `Stock with symbol ${symbol} not found`
        });
      }
      return res.json({ success: true, data: stock });
    }

    // MongoDB Logic
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock with symbol ${symbol} not found`
      });
    }

    res.json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search stocks by symbol or name
// @route   GET /api/stocks/search
// @access  Public
exports.searchStocks = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ success: false, message: 'Please provide a search term' });
  }

  try {
    if (global.useMemoryDB) {
      const searchRegex = new RegExp(q, 'i');
      const stocks = memoryDb.stocks.filter(
        s => searchRegex.test(s.symbol) || searchRegex.test(s.name)
      ).slice(0, 10);
      
      return res.json({ success: true, count: stocks.length, data: stocks });
    }

    // MongoDB Logic
    const searchRegex = new RegExp(q, 'i');
    const stocks = await Stock.find({
      $or: [
        { symbol: searchRegex },
        { name: searchRegex }
      ]
    }).limit(10);

    res.json({ success: true, count: stocks.length, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
