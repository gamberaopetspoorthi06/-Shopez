import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { LogIn, Key, Mail, TrendingUp } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        localStorage.setItem('shopez_token', response.data.token);
        localStorage.setItem('shopez_user', JSON.stringify(response.data.user));
        
        onLoginSuccess(response.data.user);
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.cardContainer}>
        {/* Brand */}
        <div style={styles.brand}>
          <TrendingUp size={36} color="#00ff88" />
          <h2 style={styles.brandTitle}>ShopEZ <span style={styles.brandSub}>Trader</span></h2>
          <p style={styles.brandTagline}>Effortless investing, real-time results.</p>
        </div>

        {/* Form Panel */}
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.formTitle}>Welcome Back</h3>
          <p style={styles.formSubtitle}>Sign in to manage your investment portfolio.</p>

          {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  className="form-input"
                  style={styles.inputWithIcon}
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={styles.inputWrapper}>
                <Key size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  className="form-input"
                  style={styles.inputWithIcon}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn size={18} />
                  Access Account
                </>
              )}
            </button>
          </form>

          <div style={styles.footerLink}>
            <span>Don't have an account? </span>
            <Link to="/register" style={styles.link}>Register Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 70px)',
    padding: '40px 16px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '440px',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '28px',
  },
  brandTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '2rem',
    fontWeight: 800,
    color: '#ffffff',
    marginTop: '10px',
    letterSpacing: '-0.03em',
  },
  brandSub: {
    color: '#00ff88',
    fontWeight: 400,
  },
  brandTagline: {
    color: '#9ca3af',
    fontSize: '0.9rem',
    marginTop: '4px',
  },
  panel: {
    padding: '36px',
  },
  formTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    textAlign: 'center',
    color: '#ffffff',
  },
  formSubtitle: {
    fontSize: '0.85rem',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: '24px',
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#6b7280',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '44px',
  },
  submitBtn: {
    marginTop: '8px',
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
  footerLink: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '0.85rem',
    color: '#9ca3af',
  },
  link: {
    color: '#00ff88',
    textDecoration: 'none',
    fontWeight: 600,
  },
};

export default Login;
