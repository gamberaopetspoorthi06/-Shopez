import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stocksAPI, tradesAPI } from '../services/api';
import StockChart from '../components/StockChart';
import TradingPanel from '../components/TradingPanel';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

const StockDetail = ({ user, onBalanceUpdate }) => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [holdingQuantity, setHoldingQuantity] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingRef = useRef(null);

  const fetchStockDetail = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch live stock data
      const stockRes = await stocksAPI.getBySymbol(symbol);
      if (stockRes.data.success) {
        setStock(stockRes.data.data);
      }

      // 2. Fetch specific user holding of this stock
      const portfolioRes = await tradesAPI.getPortfolio();
      if (portfolioRes.data.success) {
        const matchingHolding = portfolioRes.data.data.find(
          h => h.stockSymbol.toUpperCase() === symbol.toUpperCase()
        );
        setHoldingQuantity(matchingHolding ? matchingHolding.quantity : 0);
      }
    } catch (err) {
      console.error('Error fetching stock detail:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Run on mount, configure 5-second polling loop
  useEffect(() => {
    fetchStockDetail(true);

    pollingRef.current = setInterval(() => {
      fetchStockDetail(false);
    }, 5000); // 5 seconds polling

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [symbol]);

  // Execute callback on trade success
  const handleTradeSuccess = (newCashBalance, message) => {
    // 1. Force state updates locally
    fetchStockDetail(false);

    // 2. Notify parent App context to refresh navbar balance
    if (onBalanceUpdate) {
      onBalanceUpdate(newCashBalance);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.spinnerContainer}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>Retrieving chart data nodes...</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
          <ShieldAlert size={48} color="#ff0055" />
          <h2 style={{ marginTop: '16px', color: '#ffffff' }}>Stock Symbol Not Found</h2>
          <p style={{ color: '#9ca3af', margin: '12px 0 24px 0' }}>
            We could not locate any active stock under symbol "{symbol}" on our exchange.
          </p>
          <Link to="/" className="btn btn-primary">Return to Market</Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  // Generate simulated static stock metadata (for professional appearance)
  const marketCap = (stock.currentPrice * 12.5).toFixed(2); // Mock: $ billions
  const volume = Math.floor((stock.dailyHigh - stock.dailyLow) * 1500000 + 500000); // Mock volume
  const peRatio = (stock.currentPrice / 4.8).toFixed(2); // Mock P/E
  const divYield = (2.2).toFixed(2); // Mock dividend yield

  return (
    <div className="app-container">
      {/* Back button */}
      <Link to="/" style={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Market Dashboard
      </Link>

      {/* Stock Summary Header */}
      <div className="glass-panel" style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleWrapper}>
            <h1 style={styles.symbolTitle}>{stock.symbol}</h1>
            <span style={styles.nameLabel}>{stock.name}</span>
          </div>
          <p style={styles.desc}>
            Simulated market exchange listing for {stock.name}. Real-time fluctuations are computed via random-walk algorithm parameters.
          </p>
        </div>

        <div style={styles.headerRight}>
          <span style={styles.priceLabel}>Current Value</span>
          <div style={styles.priceRow}>
            <h1 
              style={{
                ...styles.currentPrice,
                color: isPositive ? '#00ff88' : '#ff0055'
              }}
            >
              ${stock.currentPrice.toFixed(2)}
            </h1>
            <div 
              style={{
                ...styles.changeBadge,
                backgroundColor: isPositive ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 0, 85, 0.08)',
                border: isPositive ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid rgba(255, 0, 85, 0.15)',
              }}
            >
              {isPositive ? <ArrowUpRight size={16} color="#00ff88" /> : <ArrowDownRight size={16} color="#ff0055" />}
              <span style={{ color: isPositive ? '#00ff88' : '#ff0055', fontWeight: 700 }}>
                {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart vs Order execution panel */}
      <div className="grid-2" style={styles.mainGrid}>
        {/* Left Column: Historical line chart & Key metrics table */}
        <div style={styles.chartCol}>
          <div className="glass-panel" style={styles.chartPanel}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Historical Performance (1-Minute Tick Interval)</h3>
              {isRefreshing && <RefreshCw size={14} className="loading-spinner" style={{ margin: 0, borderTopColor: '#00ff88' }} />}
            </div>
            <div style={styles.chartContainer}>
              <StockChart history={stock.history} isPositive={isPositive} />
            </div>
          </div>

          {/* Key Indicators Board */}
          <div className="glass-panel" style={styles.indicatorsPanel}>
            <h3 style={styles.indicatorsTitle}>Exchange Statistics</h3>
            <div className="grid-3" style={styles.statsGrid}>
              <div style={styles.statBox}>
                <span style={styles.statBoxLabel}>Daily High</span>
                <span style={{ ...styles.statBoxVal, color: '#f3f4f6' }}>${stock.dailyHigh.toFixed(2)}</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statBoxLabel}>Daily Low</span>
                <span style={{ ...styles.statBoxVal, color: '#f3f4f6' }}>${stock.dailyLow.toFixed(2)}</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statBoxLabel}>Opening Price</span>
                <span style={{ ...styles.statBoxVal, color: '#f3f4f6' }}>${stock.openingPrice.toFixed(2)}</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statBoxLabel}>Market Cap (Sim)</span>
                <span style={{ ...styles.statBoxVal, color: '#f3f4f6' }}>${marketCap}B</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statBoxLabel}>Volume Traded</span>
                <span style={{ ...styles.statBoxVal, color: '#f3f4f6' }}>{volume.toLocaleString()}</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statBoxLabel}>P/E Ratio</span>
                <span style={{ ...styles.statBoxVal, color: '#f3f4f6' }}>{peRatio}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order placement panel */}
        <div style={styles.tradeCol}>
          <TradingPanel
            stock={stock}
            user={user}
            holdingQuantity={holdingQuantity}
            onTradeSuccess={handleTradeSuccess}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    marginBottom: '20px',
    transition: 'color 0.2s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerLeft: {
    flex: 1,
    minWidth: '280px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    flexWrap: 'wrap',
  },
  symbolTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  nameLabel: {
    fontSize: '1.2rem',
    color: '#9ca3af',
    fontFamily: 'Outfit, sans-serif',
  },
  desc: {
    color: '#9ca3af',
    fontSize: '0.9rem',
    marginTop: '8px',
    maxWidth: '600px',
    lineHeight: '1.4',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: '220px',
  },
  priceLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px',
  },
  currentPrice: {
    fontSize: '2.4rem',
    fontWeight: 800,
    fontFamily: 'Outfit, sans-serif',
  },
  changeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  mainGrid: {
    alignItems: 'flex-start',
  },
  chartCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  chartPanel: {
    padding: '24px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  chartContainer: {
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '16px 8px',
  },
  indicatorsPanel: {
    padding: '24px',
  },
  indicatorsTitle: {
    fontSize: '1.1rem',
    color: '#ffffff',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '8px',
  },
  statsGrid: {
    gap: '16px',
  },
  statBox: {
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
  },
  statBoxLabel: {
    fontSize: '0.7rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  statBoxVal: {
    fontSize: '1.1rem',
    fontWeight: 700,
    fontFamily: 'Outfit, sans-serif',
    marginTop: '4px',
  },
  tradeCol: {
    position: 'sticky',
    top: '94px', // Navbar height + gap
  },
};

export default StockDetail;
