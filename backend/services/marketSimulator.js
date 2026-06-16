const Stock = require('../models/Stock');

const DEFAULT_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 175.50 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 220.30 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 380.20 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 145.80 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 485.40 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 132.60 },
  { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 325.10 },
  { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 450.70 }
];

// Helper to seed database with initial stocks
const seedStocks = async () => {
  try {
    const count = await Stock.countDocuments();
    if (count > 0) {
      console.log('Stocks already seeded.');
      return;
    }

    console.log('Seeding initial stock listings...');
    for (const s of DEFAULT_STOCKS) {
      // Generate some dummy historical data for the chart (20 points)
      const history = [];
      const now = Date.now();
      let price = s.basePrice;

      for (let i = 20; i >= 0; i--) {
        const change = (Math.random() - 0.48) * 4; // slight upward drift
        price = parseFloat((price + change).toFixed(2));
        history.push({
          price: price,
          timestamp: new Date(now - i * 60 * 1000) // 1 minute intervals in past
        });
      }

      await Stock.create({
        symbol: s.symbol,
        name: s.name,
        currentPrice: price,
        openingPrice: s.basePrice,
        dailyHigh: Math.max(...history.map(h => h.price), price),
        dailyLow: Math.min(...history.map(h => h.price), price),
        change: parseFloat((price - s.basePrice).toFixed(2)),
        changePercent: parseFloat((((price - s.basePrice) / s.basePrice) * 100).toFixed(2)),
        history: history,
        lastUpdated: new Date()
      });
    }
    console.log('Stock seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding stocks:', error.message);
  }
};

// Periodic stock price simulator (Random Walk)
const startSimulator = () => {
  console.log('Initializing Real-time Market Simulator...');
  
  // Run simulator every 10 seconds
  setInterval(async () => {
    try {
      const stocks = await Stock.find();
      for (const stock of stocks) {
        const currentPrice = stock.currentPrice;
        
        // Random walk change: -1.2% to +1.3% (slight positive drift)
        const changePct = (Math.random() * 2.5 - 1.2) / 100;
        const priceChange = parseFloat((currentPrice * changePct).toFixed(2));
        const newPrice = parseFloat((currentPrice + priceChange).toFixed(2));
        
        if (newPrice <= 1) continue; // Prevent price dropping to zero
        
        // Calculate daily stats relative to openingPrice
        const openingPrice = stock.openingPrice;
        const change = parseFloat((newPrice - openingPrice).toFixed(2));
        const changePercent = parseFloat(((change / openingPrice) * 100).toFixed(2));
        
        const dailyHigh = Math.max(stock.dailyHigh, newPrice);
        const dailyLow = Math.min(stock.dailyLow, newPrice);
        
        // Push to history rolling buffer (limit to 50 points)
        const updatedHistory = [...stock.history, { price: newPrice, timestamp: new Date() }];
        if (updatedHistory.length > 50) {
          updatedHistory.shift();
        }

        await Stock.findByIdAndUpdate(stock._id, {
          currentPrice: newPrice,
          dailyHigh,
          dailyLow,
          change,
          changePercent,
          history: updatedHistory,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Simulator error:', error.message);
    }
  }, 10000); // 10 seconds
};

module.exports = { seedStocks, startSimulator };
