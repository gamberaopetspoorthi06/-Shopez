// In-Memory Database Fallback for ShopEZ Stock Trader
// Used dynamically when local MongoDB service is unavailable

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

const memoryDb = {
  users: [],
  stocks: [],
  portfolios: [], // { id, userId, stockSymbol, quantity, averageBuyPrice }
  transactions: [], // { id, userId, stockSymbol, type, quantity, priceAtTrade, totalAmount, timestamp }
  
  initialize: () => {
    console.log('Initializing RAM database with mock stock listings...');
    const now = Date.now();
    
    memoryDb.stocks = DEFAULT_STOCKS.map((s, idx) => {
      const history = [];
      let price = s.basePrice;
      
      for (let i = 20; i >= 0; i--) {
        const change = (Math.random() - 0.48) * 4;
        price = parseFloat((price + change).toFixed(2));
        history.push({
          price: price,
          timestamp: new Date(now - i * 60 * 1000)
        });
      }

      return {
        _id: `stock_${idx}`,
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
      };
    });
  },

  startSimulator: () => {
    console.log('Starting RAM database pricing simulator ticks...');
    setInterval(() => {
      memoryDb.stocks = memoryDb.stocks.map(stock => {
        const currentPrice = stock.currentPrice;
        const changePct = (Math.random() * 2.5 - 1.2) / 100;
        const priceChange = parseFloat((currentPrice * changePct).toFixed(2));
        const newPrice = parseFloat((currentPrice + priceChange).toFixed(2));
        
        if (newPrice <= 1) return stock;

        const openingPrice = stock.openingPrice;
        const change = parseFloat((newPrice - openingPrice).toFixed(2));
        const changePercent = parseFloat(((change / openingPrice) * 100).toFixed(2));
        
        const dailyHigh = Math.max(stock.dailyHigh, newPrice);
        const dailyLow = Math.min(stock.dailyLow, newPrice);
        
        const updatedHistory = [...stock.history, { price: newPrice, timestamp: new Date() }];
        if (updatedHistory.length > 50) updatedHistory.shift();

        return {
          ...stock,
          currentPrice: newPrice,
          dailyHigh,
          dailyLow,
          change,
          changePercent,
          history: updatedHistory,
          lastUpdated: new Date()
        };
      });
    }, 10000); // Poll simulator every 10 seconds
  }
};

// Auto initialize memory database on loading
memoryDb.initialize();

module.exports = memoryDb;
