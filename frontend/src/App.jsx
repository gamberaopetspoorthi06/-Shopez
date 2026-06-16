import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './services/api';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import StockDetail from './pages/StockDetail';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Synchronize user profile on startup if token exists
  useEffect(() => {
    const syncUserSession = async () => {
      const token = localStorage.getItem('shopez_token');
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        if (response.data.success) {
          setUser(response.data.user);
          // Sync local storage user details in case role changed
          localStorage.setItem('shopez_user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Session sync failed, clearing token.');
        localStorage.removeItem('shopez_token');
        localStorage.removeItem('shopez_user');
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    syncUserSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('shopez_token');
    localStorage.removeItem('shopez_user');
    setUser(null);
  };

  // Callback to update cash balance instantly in UI on trade completions
  const handleBalanceUpdate = (newBalance) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, cashBalance: newBalance };
      localStorage.setItem('shopez_user', JSON.stringify(updated));
      return updated;
    });
  };

  if (isInitializing) {
    return (
      <div style={styles.initializingContainer}>
        <div className="loading-spinner" style={{ borderTopColor: '#00ff88' }}></div>
        <p style={styles.initializingText}>Syncing session credentials...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.appShell}>
        <Routes>
          {/* Public Auth Routes */}
          <Route 
            path="/login" 
            element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} 
          />

          {/* Secured Investor Routes */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/portfolio" 
            element={
              <PrivateRoute>
                <Portfolio />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/stocks/:symbol" 
            element={
              <PrivateRoute>
                <StockDetail user={user} onBalanceUpdate={handleBalanceUpdate} />
              </PrivateRoute>
            } 
          />

          {/* Double-Shielded Admin Control Room */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />

          {/* Global Catch All redirecting to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

const styles = {
  initializingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#070913',
  },
  initializingText: {
    color: '#9ca3af',
    fontFamily: 'Outfit, sans-serif',
    marginTop: '12px',
    fontSize: '0.95rem',
  },
  appShell: {
    minHeight: 'calc(100vh - 70px)',
  },
};

export default App;
