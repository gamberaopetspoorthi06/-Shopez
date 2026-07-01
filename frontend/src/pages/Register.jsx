import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { UserPlus, User, Mail, Key, ShieldAlert } from 'lucide-react';

const Register = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      setErrorMsg('Please complete all input fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await authAPI.register({ username, email, password });
      
      if (response.data.success) {
        localStorage.setItem('shopez_token', response.data.token);
        localStorage.setItem('shopez_user', JSON.stringify(response.data.user));
        
        onLoginSuccess(response.data.user);
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Try a different username/email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.cardContainer}>
        {/* Form Panel */}
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.formTitle}>Create Account</h3>
          <p style={styles.formSubtitle}>Join StockBridge for effortless simulated investing.</p>

          {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

          {/* Special Setup Tip */}
          <div style={styles.tipBox}>
            <ShieldAlert size={16} color="#00bfff" />
            <span style={styles.tipText}>
              **Admin Hint**: Use any email ending in **@admin.com** to automatically gain ADMIN role access!
            </span>
          </div>

          <form onSubmit={handleRegisterSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  className="form-input"
                  style={styles.inputWithIcon}
                  placeholder="investor101"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  className="form-input"
                  style={styles.inputWithIcon}
                  placeholder="trader@domain.com"
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
                  placeholder="min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={styles.inputWrapper}>
                <Key size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  className="form-input"
                  style={styles.inputWithIcon}
                  placeholder="match password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                'Registering...'
              ) : (
                <>
                  <UserPlus size={18} />
                  Register Account
                </>
              )}
            </button>
          </form>

          <div style={styles.footerLink}>
            <span>Already have an account? </span>
            <Link to="/login" style={styles.link}>Sign In Here</Link>
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
    marginBottom: '16px',
    marginTop: '4px',
  },
  tipBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '20px',
  },
  tipText: {
    fontSize: '0.75rem',
    color: '#00bfff',
    lineHeight: '1.3',
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
    color: '#111827',
    textDecoration: 'none',
    fontWeight: 600,
  },
};

export default Register;
