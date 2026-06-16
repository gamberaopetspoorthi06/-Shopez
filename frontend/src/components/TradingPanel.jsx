import React, { useState, useEffect } from 'react';
import { tradesAPI } from '../services/api';
import { ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

const TradingPanel = ({ stock, user, holdingQuantity = 0, onTradeSuccess }) => {
  const [tradeType, setTradeType] = useState('BUY'); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Clear messages when stock or trade type changes
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setQuantity(1);
  }, [stock.symbol, tradeType]);

  const price = stock.currentPrice;
  const totalCost = parseFloat((price * quantity).toFixed(2));
  const hasEnoughCash = user ? user.cashBalance >= totalCost : false;
  const hasEnoughHoldings = holdingQuantity >= quantity;

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1) {
      setQuantity(val);
    } else if (e.target.value === '') {
      setQuantity('');
    }
  };

  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      setErrorMsg('Please enter a valid quantity of shares.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      let response;
      if (tradeType === 'BUY') {
        response = await tradesAPI.buy({ symbol: stock.symbol, quantity });
      } else {
        response = await tradesAPI.sell({ symbol: stock.symbol, quantity });
      }

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        
        // Pass updated data back to parent context (e.g. cashBalance)
        if (onTradeSuccess) {
          onTradeSuccess(response.data.data.cashBalance, response.data.message);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Trade execution failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={styles.container}>
      <h3 style={styles.title}>Execute Order</h3>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(tradeType === 'BUY' ? styles.activeBuyTab : {})
          }}
          onClick={() => setTradeType('BUY')}
        >
          Buy {stock.symbol}
        </button>
        <button
          style={{
            ...styles.tab,
            ...(tradeType === 'SELL' ? styles.activeSellTab : {})
          }}
          onClick={() => setTradeType('SELL')}
        >
          Sell {stock.symbol}
        </button>
      </div>

      <form onSubmit={handleExecuteTrade} style={styles.form}>
        {/* Quantity Field */}
        <div className="form-group">
          <label className="form-label">Shares Quantity</label>
          <input
            type="number"
            className="form-input"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            disabled={isLoading}
            required
          />
        </div>

        {/* Trade Details */}
        <div style={styles.details}>
          <div className="stats-row">
            <span className="stats-label">Market Price</span>
            <span className="stats-value">${price.toFixed(2)}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Shares Owned</span>
            <span className="stats-value">{holdingQuantity}</span>
          </div>
          <div className="stats-row" style={styles.totalRow}>
            <span className="stats-label" style={styles.totalLabel}>
              {tradeType === 'BUY' ? 'Total Cost' : 'Total Revenue'}
            </span>
            <span 
              className="stats-value" 
              style={{
                ...styles.totalValue,
                color: tradeType === 'BUY' ? '#00ff88' : '#ff0055'
              }}
            >
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Validation Errors */}
        {tradeType === 'BUY' && !hasEnoughCash && quantity > 0 && (
          <div style={styles.warning}>
            <AlertTriangle size={16} />
            <span>Insufficient cash to place this order</span>
          </div>
        )}

        {tradeType === 'SELL' && !hasEnoughHoldings && quantity > 0 && (
          <div style={styles.warning}>
            <AlertTriangle size={16} />
            <span>Insufficient holdings to sell this amount</span>
          </div>
        )}

        {/* Success/Error Toasts */}
        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
        {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-block"
          style={{
            background: tradeType === 'BUY' ? '#00ff88' : '#ff0055',
            color: tradeType === 'BUY' ? '#070913' : '#ffffff',
            boxShadow: tradeType === 'BUY' ? '0 0 15px rgba(0, 255, 136, 0.25)' : '0 0 15px rgba(255, 0, 85, 0.25)'
          }}
          disabled={
            isLoading ||
            (tradeType === 'BUY' && !hasEnoughCash) ||
            (tradeType === 'SELL' && !hasEnoughHoldings) ||
            !quantity
          }
        >
          {isLoading ? (
            'Executing Order...'
          ) : (
            <>
              {tradeType === 'BUY' ? <ShoppingCart size={18} /> : <TrendingUp size={18} />}
              {tradeType === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  title: {
    fontSize: '1.2rem',
    marginBottom: '16px',
    color: '#ffffff',
  },
  tabs: {
    display: 'flex',
    borderRadius: '10px',
    background: 'rgba(0, 0, 0, 0.25)',
    padding: '4px',
    marginBottom: '20px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    borderRadius: '8px',
    fontWeight: 600,
    fontFamily: 'Outfit, sans-serif',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  },
  activeBuyTab: {
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    border: '1px solid rgba(0, 255, 136, 0.15)',
  },
  activeSellTab: {
    background: 'rgba(255, 0, 85, 0.1)',
    color: '#ff0055',
    border: '1px solid rgba(255, 0, 85, 0.15)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  details: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '12px',
  },
  totalRow: {
    marginTop: '6px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  totalLabel: {
    fontWeight: 700,
    color: '#ffffff',
  },
  totalValue: {
    fontSize: '1.2rem',
    fontWeight: 800,
  },
  warning: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 170, 0, 0.08)',
    border: '1px solid rgba(255, 170, 0, 0.2)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#ffaa00',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  errorAlert: {
    background: 'rgba(255, 0, 85, 0.08)',
    border: '1px solid rgba(255, 0, 85, 0.2)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#ff3377',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  successAlert: {
    background: 'rgba(0, 255, 136, 0.08)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#33ffaa',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
};

export default TradingPanel;
