const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Please add a stock symbol'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a company name']
  },
  currentPrice: {
    type: Number,
    required: true
  },
  dailyHigh: {
    type: Number,
    required: true
  },
  dailyLow: {
    type: Number,
    required: true
  },
  openingPrice: {
    type: Number,
    required: true
  },
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  history: [
    {
      price: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Stock', StockSchema);
