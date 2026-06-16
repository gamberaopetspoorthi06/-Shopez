const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stockSymbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  averageBuyPrice: {
    type: Number,
    required: true
  }
});

// Set compound unique index so a user has at most one record per stock symbol
PortfolioSchema.index({ user: 1, stockSymbol: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
