import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('shopez_token');
  const userString = localStorage.getItem('shopez_user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userString);
    return user.role === 'ADMIN' ? children : <Navigate to="/" replace />;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;
