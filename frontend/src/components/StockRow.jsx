import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const StockRow = ({ stock }) => {
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
    <tr 
      onClick={() => navigate(`/stocks/${stock.symbol}`)}
      style={{ cursor: 'pointer' }}
    >
      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{stock.symbol}</td>
      <td style={{ color: 'var(--text-muted)' }}>{stock.name}</td>
      <td style={{ textAlign: 'right' }}>
        <span className={`mono-price ${pulseClass}`}>
          ${stock.currentPrice.toFixed(2)}
        </span>
      </td>
      <td style={{ textAlign: 'right', color: isPositive ? '#22c55e' : '#ef4444' }} className="mono-price">
        {isPositive ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
      </td>
      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="mono-price">${stock.dailyHigh.toFixed(2)}</td>
      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="mono-price">${stock.dailyLow.toFixed(2)}</td>
    </tr>
  );
};

export default StockRow;
