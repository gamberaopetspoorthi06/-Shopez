import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, Briefcase, ShieldAlert, LogOut, LogIn, UserPlus, Wallet } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <TrendingUp size={24} color="#00ff88" />
          <span style={styles.logoText}>StockBridge</span>
        </Link>

        <div style={styles.navLinks}>
          {user ? (
            <>
              <Link 
                to="/" 
                style={{
                  ...styles.link,
                  ...(isActive('/') ? styles.activeLink : {})
                }}
              >
                <TrendingUp size={18} />
                Market
              </Link>
              <Link 
                to="/portfolio" 
                style={{
                  ...styles.link,
                  ...(isActive('/portfolio') ? styles.activeLink : {})
                }}
              >
                <Briefcase size={18} />
                Portfolio
              </Link>
              {user.role === 'ADMIN' && (
                <Link 
                  to="/admin" 
                  style={{
                    ...styles.link,
                    ...(isActive('/admin') ? styles.activeLink : {}),
                    color: '#00bfff'
                  }}
                >
                  <ShieldAlert size={18} />
                  Admin Panel
                </Link>
              )}
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                style={{
                  ...styles.link,
                  ...(isActive('/login') ? styles.activeLink : {})
                }}
              >
                <LogIn size={18} />
                Login
              </Link>
              <Link 
                to="/register" 
                style={{
                  ...styles.link,
                  ...(isActive('/register') ? styles.activeLink : {})
                }}
              >
                <UserPlus size={18} />
                Register
              </Link>
            </>
          )}
        </div>

        {user && (
          <div style={styles.userSection}>
            <div style={styles.balanceCard}>
              <Wallet size={16} color="#00ff88" />
              <span style={styles.balanceLabel}>Cash:</span>
              <span style={styles.balanceValue}>
                ${parseFloat(user.cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span style={styles.username}>Hi, {user.username}</span>
            <button onClick={handleLogoutClick} style={styles.logoutBtn} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'rgba(13, 17, 36, 0.7)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
  },
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '0 20px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoText: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.03em',
  },
  logoSub: {
    color: '#00ff88',
    fontWeight: 400,
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 500,
    fontFamily: 'Outfit, sans-serif',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  activeLink: {
    color: '#00ff88',
    background: 'rgba(0, 255, 136, 0.08)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  balanceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '6px 12px',
    borderRadius: '10px',
  },
  balanceLabel: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  balanceValue: {
    fontSize: '0.95rem',
    color: '#00ff88',
    fontWeight: 700,
    fontFamily: 'Outfit, sans-serif',
  },
  username: {
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
};

export default Navbar;
