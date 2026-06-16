import React, { useState, useEffect, useRef } from 'react';
import { stocksAPI, authAPI } from '../services/api';
import StockCard from '../components/StockCard';
import { Search, TrendingUp, TrendingDown, RefreshCw, BarChart2, Activity } from 'lucide-react';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({ portfolioValue: 0, totalNetWorth: 0, cashBalance: 10000 });
  const [isUpdating, setIsUpdating] = useState(false);
  const pollingRef = useRef(null);

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsUpdating(true);
    
    try {
      // 1. Fetch live stock listings
      const stockRes = await stocksAPI.getAll();
      if (stockRes.data.success) {
        setStocks(stockRes.data.data);
      }

      // 2. Fetch active user portfolio aggregated balance values
      const userRes = await authAPI.getMe();
      if (userRes.data.success) {
        setDashboardStats({
          portfolioValue: userRes.data.user.portfolioValue,
          totalNetWorth: userRes.data.user.totalNetWorth,
          cashBalance: userRes.data.user.cashBalance
        });
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  // Run on mount, set up 5-second live stock pricing polling
  useEffect(() => {
    fetchDashboardData(true);
    
    pollingRef.current = setInterval(() => {
      fetchDashboardData(false);
    }, 5000); // 5 seconds polling

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Filter stocks by search query
  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Derive Top Gainers and Top Losers
  const sortedStocks = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const topGainers = sortedStocks.slice(0, 3).filter(s => s.changePercent > 0);
  const topLosers = [...sortedStocks].reverse().slice(0, 3).filter(s => s.changePercent < 0);

  if (isLoading) {
    return (
      <div style={styles.spinnerContainer}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>Connecting to trading desk...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Welcome & Live Balance Summary Banner */}
      <div className="glass-panel" style={styles.banner}>
        <div style={styles.bannerLeft}>
          <h1 style={styles.welcomeText}>Live Stock Market</h1>
          <p style={styles.welcomeSub}>Explore shares, analyze charts, and place mock orders in real time.</p>
        </div>
        
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <span style={styles.statCardLabel}>Total Portfolio Value</span>
            <span style={styles.statCardVal}>${dashboardStats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={styles.statCardLabel}>Cash Balance</span>
            <span style={{ ...styles.statCardVal, color: '#00ff88' }}>${dashboardStats.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={styles.statCardLabel}>Total Net Worth</span>
            <span style={{ ...styles.statCardVal, color: '#00bfff' }}>${dashboardStats.totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Market Mover Boards */}
      <div style={styles.moversRow}>
        {/* Top Gainers */}
        <div className="glass-panel" style={styles.moverBoard}>
          <div style={styles.boardHeader}>
            <TrendingUp size={20} color="#00ff88" />
            <h3 style={styles.boardTitle}>Top Gainers</h3>
          </div>
          <div style={styles.moverList}>
            {topGainers.length > 0 ? (
              topGainers.map(s => (
                <div key={s.symbol} style={styles.moverItem}>
                  <span style={styles.moverSymbol}>{s.symbol}</span>
                  <span style={styles.moverPrice}>${s.currentPrice.toFixed(2)}</span>
                  <span style={{ ...styles.moverChange, color: '#00ff88' }}>+{s.changePercent.toFixed(2)}%</span>
                </div>
              ))
            ) : (
              <span style={styles.noMoverText}>No positive stocks this tick</span>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div className="glass-panel" style={styles.moverBoard}>
          <div style={styles.boardHeader}>
            <TrendingDown size={20} color="#ff0055" />
            <h3 style={styles.boardTitle}>Top Losers</h3>
          </div>
          <div style={styles.moverList}>
            {topLosers.length > 0 ? (
              topLosers.map(s => (
                <div key={s.symbol} style={styles.moverItem}>
                  <span style={styles.moverSymbol}>{s.symbol}</span>
                  <span style={styles.moverPrice}>${s.currentPrice.toFixed(2)}</span>
                  <span style={{ ...styles.moverChange, color: '#ff0055' }}>{s.changePercent.toFixed(2)}%</span>
                </div>
              ))
            ) : (
              <span style={styles.noMoverText}>No negative stocks this tick</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Stock Catalog Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            className="form-input"
            style={styles.searchInput}
            placeholder="Search stocks by symbol or name (e.g. AAPL, Tesla)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={styles.syncIndicator}>
          {isUpdating && <RefreshCw size={14} className="loading-spinner" style={{ margin: 0, marginRight: '8px', borderTopColor: '#00ff88' }} />}
          <Activity size={14} color="#00ff88" style={{ marginRight: '6px' }} />
          <span style={styles.syncText}>{isUpdating ? 'Polling prices...' : 'Live price feed synced'}</span>
        </div>
      </div>

      {/* Stock Cards Listing Grid */}
      {filteredStocks.length > 0 ? (
        <div className="grid-4">
          {filteredStocks.map(stock => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={styles.emptyContainer}>
          <BarChart2 size={48} color="#6b7280" />
          <h3 style={styles.emptyTitle}>No Stocks Found</h3>
          <p style={styles.emptyText}>No stocks in our exchange matched your search term "{searchTerm}". Try another query.</p>
        </div>
      )}
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
  banner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    background: 'linear-gradient(135deg, rgba(13, 17, 36, 0.8) 0%, rgba(18, 22, 43, 0.6) 100%)',
    flexWrap: 'wrap',
    gap: '24px',
  },
  bannerLeft: {
    flex: 1,
    minWidth: '280px',
  },
  welcomeText: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '2rem',
    color: '#ffffff',
    fontWeight: 800,
  },
  welcomeSub: {
    color: '#9ca3af',
    marginTop: '6px',
    fontSize: '0.95rem',
  },
  statsContainer: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '8px',
    flexWrap: 'wrap',
  },
  statCard: {
    padding: '12px 20px',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '150px',
  },
  statCardLabel: {
    fontSize: '0.7rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  statCardVal: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    marginTop: '4px',
  },
  moversRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  moverBoard: {
    padding: '16px 20px',
  },
  boardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '8px',
  },
  boardTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  moverList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  moverItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    fontSize: '0.9rem',
  },
  moverSymbol: {
    fontWeight: 700,
    color: '#ffffff',
    width: '60px',
  },
  moverPrice: {
    color: '#e5e7eb',
    fontFamily: 'Outfit, sans-serif',
  },
  moverChange: {
    fontWeight: 700,
    fontFamily: 'Outfit, sans-serif',
  },
  noMoverText: {
    fontSize: '0.85rem',
    color: '#6b7280',
    textAlign: 'center',
    padding: '10px 0',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '280px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#6b7280',
  },
  searchInput: {
    paddingLeft: '44px',
  },
  syncIndicator: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 255, 136, 0.05)',
    border: '1px solid rgba(0, 255, 136, 0.15)',
    padding: '8px 16px',
    borderRadius: '10px',
  },
  syncText: {
    fontSize: '0.8rem',
    color: '#00ff88',
    fontWeight: 600,
    fontFamily: 'Outfit, sans-serif',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.4rem',
    color: '#ffffff',
    marginTop: '16px',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '0.9rem',
    maxWidth: '460px',
    marginTop: '8px',
  },
};

export default Dashboard;
