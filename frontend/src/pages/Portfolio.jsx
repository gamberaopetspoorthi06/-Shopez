import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tradesAPI } from '../services/api';
import { Briefcase, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Calendar } from 'lucide-react';

const Portfolio = () => {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPortfolioData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch active holdings
      const holdingsRes = await tradesAPI.getPortfolio();
      if (holdingsRes.data.success) {
        setHoldings(holdingsRes.data.data);
      }

      // 2. Fetch past transaction history
      const historyRes = await tradesAPI.getHistory();
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData(true);

    // Poll portfolio values every 10 seconds to keep market value synced
    const interval = setInterval(() => {
      fetchPortfolioData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Compute aggregate indicators
  const totalStockCostBasis = holdings.reduce((acc, h) => acc + h.costBasis, 0);
  const totalStockMarketValue = holdings.reduce((acc, h) => acc + h.marketValue, 0);
  const totalNetGainLoss = parseFloat((totalStockMarketValue - totalStockCostBasis).toFixed(2));
  const netGainLossPercent = totalStockCostBasis > 0 
    ? parseFloat(((totalNetGainLoss / totalStockCostBasis) * 100).toFixed(2)) 
    : 0;

  const isNetPositive = totalNetGainLoss >= 0;

  if (isLoading) {
    return (
      <div style={styles.spinnerContainer}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>Loading asset allocation...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Portfolio Aggregated Header Cards */}
      <div style={styles.toolbar}>
        <h1 style={styles.pageTitle}>Investment Portfolio</h1>
        <button 
          onClick={() => fetchPortfolioData(false)} 
          style={styles.refreshBtn}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? 'loading-spinner' : ''} style={{ margin: 0, borderTopColor: '#00ff88' }} />
          {isRefreshing ? 'Refreshing...' : 'Update Assets'}
        </button>
      </div>

      <div style={styles.statsRow}>
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <Briefcase size={18} color="#00bfff" />
            <span style={styles.statCardLabel}>Active Equity Assets</span>
          </div>
          <h2 style={styles.statCardVal}>${totalStockMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          <span style={styles.statCardSub}>Total value of active stock holdings</span>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <DollarSign size={18} color="#ffb300" />
            <span style={styles.statCardLabel}>Equity Cost Basis</span>
          </div>
          <h2 style={styles.statCardVal}>${totalStockCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          <span style={styles.statCardSub}>Total virtual money invested in stocks</span>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statCardHeader}>
            {isNetPositive ? <ArrowUpRight size={18} color="#00ff88" /> : <ArrowDownRight size={18} color="#ff0055" />}
            <span style={styles.statCardLabel}>Net Portfolio Return</span>
          </div>
          <h2 
            style={{ 
              ...styles.statCardVal, 
              color: isNetPositive ? '#00ff88' : '#ff0055' 
            }}
          >
            {isNetPositive ? '+' : ''}${totalNetGainLoss.toLocaleString()}
          </h2>
          <span 
            style={{ 
              ...styles.statCardSub, 
              color: isNetPositive ? '#00ff88' : '#ff0055',
              fontWeight: 600
            }}
          >
            {isNetPositive ? '▲' : '▼'} {isNetPositive ? '+' : ''}{netGainLossPercent}% overall return
          </span>
        </div>
      </div>

      {/* Main Grid: Active holdings table vs Transaction feed */}
      <div className="grid-2" style={styles.mainGrid}>
        
        {/* Left Col: Holdings table */}
        <div style={styles.holdingsContainer}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={styles.panelTitle}>Current Holdings</h3>
            
            {holdings.length > 0 ? (
              <div className="premium-table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Qty</th>
                      <th>Avg Cost</th>
                      <th>Current Price</th>
                      <th>Market Value</th>
                      <th>Net Return</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(h => {
                      const isGain = h.gainLoss >= 0;
                      return (
                        <tr key={h.stockSymbol}>
                          <td style={styles.assetCell}>
                            <span style={styles.assetSymbol}>{h.stockSymbol}</span>
                            <span style={styles.assetName}>{h.companyName}</span>
                          </td>
                          <td style={styles.weightCell}>{h.quantity}</td>
                          <td style={styles.numberCell}>${h.averageBuyPrice.toFixed(2)}</td>
                          <td style={styles.numberCell}>${h.currentPrice.toFixed(2)}</td>
                          <td style={styles.numberCell}><strong style={{ color: '#ffffff' }}>${h.marketValue.toFixed(2)}</strong></td>
                          <td style={{ ...styles.numberCell, color: isGain ? '#00ff88' : '#ff0055' }}>
                            <span style={styles.gainLossRow}>
                              {isGain ? '+' : ''}{h.gainLoss.toFixed(2)} ({isGain ? '+' : ''}{h.gainLossPercent}%)
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => navigate(`/stocks/${h.stockSymbol}`)}
                            >
                              Trade
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.emptyTableState}>
                <BarChart2 size={40} color="#6b7280" />
                <h4 style={styles.emptyTableTitle}>No Assets Owned Yet</h4>
                <p style={styles.emptyTableText}>
                  Your portfolio is empty. Explore the <Link to="/" style={{ color: '#00ff88', fontWeight: 600 }}>Market Dashboard</Link> to buy your first stock!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Transaction History */}
        <div style={styles.historyContainer}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={styles.panelTitle}>Past Transactions</h3>

            {history.length > 0 ? (
              <div style={styles.historyList}>
                {history.map(t => {
                  const isBuy = t.type === 'BUY';
                  const date = new Date(t.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div key={t._id} style={styles.historyItem}>
                      <div style={styles.historyItemLeft}>
                        <div 
                          style={{
                            ...styles.historyBadge,
                            backgroundColor: isBuy ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 0, 85, 0.08)',
                            border: isBuy ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid rgba(255, 0, 85, 0.15)',
                            color: isBuy ? '#00ff88' : '#ff0055'
                          }}
                        >
                          {t.type}
                        </div>
                        <div style={styles.historyItemMeta}>
                          <span style={styles.historySymbol}>{t.stockSymbol}</span>
                          <span style={styles.historyDate}>
                            <Calendar size={11} style={{ marginRight: '4px' }} />
                            {date}
                          </span>
                        </div>
                      </div>

                      <div style={styles.historyItemRight}>
                        <span style={styles.historyCost}>${t.totalAmount.toFixed(2)}</span>
                        <span style={styles.historyVolume}>
                          {t.quantity} share{t.quantity > 1 ? 's' : ''} @ ${t.priceAtTrade.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyTableState}>
                <Calendar size={36} color="#6b7280" />
                <h4 style={styles.emptyTableTitle}>No Trade History</h4>
                <p style={styles.emptyTableText}>Your trading history is currently clear.</p>
              </div>
            )}
          </div>
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
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '2rem',
    color: '#000000',
    fontWeight: 800,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#f3f4f6',
    cursor: 'pointer',
    padding: '10px 18px',
    borderRadius: '10px',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    marginBottom: '28px',
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  statCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  statCardLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  statCardVal: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
  },
  statCardSub: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginTop: '6px',
  },
  mainGrid: {
    gridTemplateColumns: '2fr 1.1fr',
    alignItems: 'flex-start',
  },
  holdingsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  historyContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  panelTitle: {
    fontSize: '1.2rem',
    color: '#ffffff',
    marginBottom: '16px',
    fontFamily: 'Outfit, sans-serif',
  },
  assetCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  assetSymbol: {
    fontWeight: 700,
    color: '#ffffff',
  },
  assetName: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  weightCell: {
    fontWeight: 600,
    color: '#f3f4f6',
    fontFamily: 'Outfit, sans-serif',
  },
  numberCell: {
    fontFamily: 'Outfit, sans-serif',
  },
  gainLossRow: {
    fontWeight: 700,
  },
  emptyTableState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  emptyTableTitle: {
    fontSize: '1.05rem',
    color: '#ffffff',
    marginTop: '12px',
  },
  emptyTableText: {
    color: '#6b7280',
    fontSize: '0.85rem',
    marginTop: '6px',
    maxWidth: '300px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '480px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  historyItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  historyBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: 800,
    fontFamily: 'Outfit, sans-serif',
  },
  historyItemMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  historySymbol: {
    fontWeight: 700,
    color: '#ffffff',
    fontSize: '0.9rem',
  },
  historyDate: {
    fontSize: '0.7rem',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    marginTop: '2px',
  },
  historyItemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  historyCost: {
    fontWeight: 700,
    color: '#ffffff',
    fontSize: '0.95rem',
    fontFamily: 'Outfit, sans-serif',
  },
  historyVolume: {
    fontSize: '0.7rem',
    color: '#6b7280',
    marginTop: '2px',
  },
};

export default Portfolio;

