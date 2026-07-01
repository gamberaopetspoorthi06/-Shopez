import React, { useState, useEffect } from 'react';
import { adminAPI, stocksAPI } from '../services/api';
import { ShieldAlert, Users, LineChart, PlusCircle, Trash2, ArrowUpDown, Calendar, DollarSign, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [trades, setTrades] = useState([]);
  
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [crudLoading, setCrudLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const analyticRes = await adminAPI.getAnalytics();
      if (analyticRes.data.success) setAnalytics(analyticRes.data.analytics);

      const userRes = await adminAPI.getUsers();
      if (userRes.data.success) setUsers(userRes.data.data);

      const stockRes = await stocksAPI.getAll();
      if (stockRes.data.success) setStocks(stockRes.data.data);

      const tradeRes = await adminAPI.getAllTrades();
      if (tradeRes.data.success) setTrades(tradeRes.data.data);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newSymbol || !newName || !newPrice || parseFloat(newPrice) <= 0) {
      setErrorMsg('Please specify a unique ticker, full company name, and a valid base price > 0.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setCrudLoading(true);

    try {
      const res = await adminAPI.createStock({
        symbol: newSymbol,
        name: newName,
        startingPrice: newPrice
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setNewSymbol('');
        setNewName('');
        setNewPrice('');
        fetchAdminData(); // Refresh active lists
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to list new stock.');
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteStock = async (symbol) => {
    if (!window.confirm(`Are you sure you want to remove ${symbol} from the exchange?`)) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const res = await adminAPI.deleteStock(symbol);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to remove stock.');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Update role of user to ${nextRole}?`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await adminAPI.updateUserRole(userId, nextRole);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to alter user role.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`CAUTION: Are you sure you want to delete user "${username}"? This will wipe their investment portfolios and transaction logs.`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await adminAPI.deleteUser(userId);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  if (isLoading) {
    return (
      <div style={styles.spinnerContainer}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>Aggregating system statistics...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Title */}
      <div style={styles.header}>
        <ShieldAlert size={28} color="#00bfff" />
        <h1 style={styles.pageTitle}>System Administration</h1>
      </div>

      {successMsg && <div style={styles.successAlert}>{successMsg}</div>}
      {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

      {/* Analytics Aggregate Tiles */}
      {analytics && (
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statCardLabel}>Active Platform Users</span>
            <h2 style={styles.statCardVal}>{analytics.totalUsers}</h2>
            <span style={styles.statCardSub}>Registered trade accounts</span>
          </div>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statCardLabel}>Cumulative Transactions</span>
            <h2 style={styles.statCardVal}>{analytics.totalTrades}</h2>
            <span style={styles.statCardSub}>Buys & sells logged</span>
          </div>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statCardLabel}>Total Trade Volume</span>
            <h2 style={{ ...styles.statCardVal, color: '#00ff88' }}>${analytics.totalVolume.toLocaleString()}</h2>
            <span style={styles.statCardSub}>Simulated capital cycled</span>
          </div>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statCardLabel}>Global Locked Assets</span>
            <h2 style={{ ...styles.statCardVal, color: '#00bfff' }}>${analytics.totalAssets.toLocaleString()}</h2>
            <span style={styles.statCardSub}>Cash: ${analytics.totalCashInSystem.toLocaleString()} | Stocks: ${analytics.totalEquityInSystem.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Main Split Panels */}
      <div className="grid-2" style={styles.splitGrid}>
        
        {/* Left Side: Stock Listing Controls & Global Trade Feed */}
        <div style={styles.leftCol}>
          {/* Create Stock Listing Form */}
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={styles.panelTitle}>List New Stock on Exchange</h3>
            <form onSubmit={handleAddStock} style={styles.addForm}>
              <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                <label className="form-label">Ticker Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="EX: GOOG"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  disabled={crudLoading}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 2, minWidth: '160px', marginBottom: 0 }}>
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="EX: Google Inc."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={crudLoading}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1.2, minWidth: '110px', marginBottom: 0 }}>
                <label className="form-label">Base Share Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  className="form-input"
                  placeholder="EX: 120.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  disabled={crudLoading}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={styles.addBtn}
                disabled={crudLoading}
              >
                <PlusCircle size={18} />
                List Stock
              </button>
            </form>
          </div>

          {/* Active Stock Listings Table */}
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={styles.panelTitle}>Exchange Tickers</h3>
            <div className="premium-table-wrapper" style={{ maxHeight: '340px' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company Name</th>
                    <th>Price</th>
                    <th>Daily Range</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map(s => (
                    <tr key={s.symbol}>
                      <td><strong>{s.symbol}</strong></td>
                      <td style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{s.name}</td>
                      <td style={{ fontFamily: 'Outfit, sans-serif' }}>${s.currentPrice.toFixed(2)}</td>
                      <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        ${s.dailyLow.toFixed(2)} - ${s.dailyHigh.toFixed(2)}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteStock(s.symbol)}
                          title="Purge ticker"
                          style={{ padding: '5px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platform Order Audit Feed */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={styles.panelTitle}>Platform Audit Logs</h3>
            {trades.length > 0 ? (
              <div style={styles.tradeFeed}>
                {trades.map(t => {
                  const isBuy = t.type === 'BUY';
                  const date = new Date(t.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div key={t._id} style={styles.feedItem}>
                      <div style={styles.feedLeft}>
                        <div 
                          style={{
                            ...styles.feedBadge,
                            color: isBuy ? '#00ff88' : '#ff0055',
                            borderColor: isBuy ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 85, 0.2)',
                            background: isBuy ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 0, 85, 0.05)'
                          }}
                        >
                          {t.type}
                        </div>
                        <div style={styles.feedItemDetails}>
                          <div>
                            <strong style={{ color: '#ffffff' }}>{t.stockSymbol}</strong>
                            <span style={styles.feedUser}>by {t.user ? t.user.username : 'Unknown User'}</span>
                          </div>
                          <span style={styles.feedDate}>
                            <Calendar size={10} style={{ marginRight: '4px' }} />
                            {date}
                          </span>
                        </div>
                      </div>

                      <div style={styles.feedRight}>
                        <span style={styles.feedAmount}>${t.totalAmount.toFixed(2)}</span>
                        <span style={styles.feedVolume}>{t.quantity} share{t.quantity > 1 ? 's' : ''} @ ${t.priceAtTrade.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No trade logs recorded.</p>
            )}
          </div>

        </div>

        {/* Right Side: Account Moderation panel */}
        <div style={styles.rightCol}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={styles.panelTitle}>Platform User Accounts</h3>
            <div className="premium-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Cash</th>
                    <th>Stock Equity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={styles.userCell}>
                        <span style={styles.userName}>{u.username}</span>
                        <span style={styles.userEmail}>{u.email}</span>
                      </td>
                      <td>
                        <span 
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}
                          style={{ cursor: 'pointer' }}
                          title="Click to toggle role"
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>
                        ${u.cashBalance.toFixed(2)}
                      </td>
                      <td style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', color: '#00bfff' }}>
                        ${u.portfolioValue.toFixed(2)}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          title="Delete user account"
                          style={{ padding: '5px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  pageTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '2rem',
    color: '#000000',
    fontWeight: 800,
  },
  statCard: {
    padding: '20px',
  },
  statCardLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  statCardVal: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    marginTop: '6px',
  },
  statCardSub: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '6px',
  },
  splitGrid: {
    gridTemplateColumns: '1.2fr 1fr',
    alignItems: 'flex-start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightCol: {
    position: 'sticky',
    top: '94px',
  },
  panelTitle: {
    fontSize: '1.2rem',
    color: '#ffffff',
    marginBottom: '16px',
    fontFamily: 'Outfit, sans-serif',
  },
  addForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap',
  },
  addBtn: {
    height: '46px',
    padding: '0 16px',
  },
  tradeFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '380px',
    overflowY: 'auto',
  },
  feedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  feedLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  feedBadge: {
    fontSize: '0.65rem',
    fontWeight: 800,
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid',
    fontFamily: 'Outfit, sans-serif',
  },
  feedItemDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  feedUser: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginLeft: '6px',
  },
  feedDate: {
    fontSize: '0.65rem',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    marginTop: '2px',
  },
  feedRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  feedAmount: {
    fontWeight: 700,
    color: '#ffffff',
    fontSize: '0.9rem',
    fontFamily: 'Outfit, sans-serif',
  },
  feedVolume: {
    fontSize: '0.65rem',
    color: '#6b7280',
    marginTop: '2px',
  },
  userCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontWeight: 700,
    color: '#ffffff',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  successAlert: {
    background: 'rgba(0, 255, 136, 0.08)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#33ffaa',
    fontSize: '0.85rem',
    marginBottom: '20px',
    fontWeight: 500,
  },
  errorAlert: {
    background: 'rgba(255, 0, 85, 0.08)',
    border: '1px solid rgba(255, 0, 85, 0.2)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ff3377',
    fontSize: '0.85rem',
    marginBottom: '20px',
    fontWeight: 500,
  },
};

export default AdminDashboard;

