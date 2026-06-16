import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const StockCard = ({ stock }) => {
  const navigate = useNavigate();
  const [pulseClass, setPulseClass] = useState('');
  const prevPriceRef = useRef(stock.currentPrice);

  // Trigger pulse animation when price updates in real time
  useEffect(() => {
    if (stock.currentPrice > prevPriceRef.current) {
      setPulseClass('pulse-up');
      const timer = setTimeout(() => setPulseClass(''), 1000);
      prevPriceRef.current = stock.currentPrice;
      return () => clearTimeout(timer);
    } else if (stock.currentPrice < prevPriceRef.current) {
      setPulseClass('pulse-down');
      const timer = setTimeout(() => setPulseClass(''), 1000);
      prevPriceRef.current = stock.currentPrice;
      return () => clearTimeout(timer);
    }
  }, [stock.currentPrice]);

  const isPositive = stock.change >= 0;

  return (
    <div 
      className={`glass-panel clickable ${pulseClass}`} 
      onClick={() => navigate(`/stocks/${stock.symbol}`)}
      style={styles.card}
    >
      <div style={styles.header}>
        <div>
          <h4 style={styles.symbol}>{stock.symbol}</h4>
          <span style={styles.name}>{stock.name}</span>
        </div>
        <div 
          style={{
            ...styles.badge,
            backgroundColor: isPositive ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 0, 85, 0.08)',
            border: isPositive ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid rgba(255, 0, 85, 0.15)',
          }}
        >
          {isPositive ? (
            <ArrowUpRight size={14} color="#00ff88" />
          ) : (
            <ArrowDownRight size={14} color="#ff0055" />
          )}
          <span style={{ color: isPositive ? '#00ff88' : '#ff0055', fontWeight: 600, fontSize: '0.75rem' }}>
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.priceContainer}>
          <span style={styles.priceLabel}>Current Price</span>
          <h2 
            style={{
              ...styles.price,
              color: isPositive ? '#00ff88' : '#ff0055'
            }}
          >
            ${stock.currentPrice.toFixed(2)}
          </h2>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>Daily High</span>
          <span style={styles.statValue}>${stock.dailyHigh.toFixed(2)}</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>Daily Low</span>
          <span style={styles.statValue}>${stock.dailyLow.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '190px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  symbol: {
    fontSize: '1.25rem',
    color: '#ffffff',
    fontWeight: 700,
  },
  name: {
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  body: {
    marginBottom: '16px',
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  price: {
    fontSize: '1.75rem',
    fontWeight: 800,
    fontFamily: 'Outfit, sans-serif',
    marginTop: '2px',
  },
  footer: {
    display: 'flex',
    gap: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '12px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#f3f4f6',
    fontFamily: 'Outfit, sans-serif',
  },
};

export default StockCard;
