import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Vanilla JavaScript decoder for JWT (avoids package Bloat, highly performant)
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('vault_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse user information from token on load/change
  useEffect(() => {
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({
          id: decoded.id,
          email: decoded.email,
          displayName: decoded.displayName
        });
      } else {
        // Token has expired
        handleLogout();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const handleLogin = (userData) => {
    localStorage.setItem('vault_token', userData.token);
    setToken(userData.token);
    setUser({
      id: userData._id,
      email: userData.email,
      displayName: userData.displayName
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('vault_token');
    setToken(null);
    setUser(null);
  };

  // Wrapped fetch that handles JWT injection and auto-logout on 401
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Dynamic backend URL injection for production environments
    const API_URL = import.meta.env.VITE_API_URL || '';
    const targetUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    try {
      const res = await fetch(targetUrl, { ...options, headers });
      
      // Auto-logout and redirect if 401 Unauthorized is intercepted
      if (res.status === 401) {
        handleLogout();
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired, logging out.'));
      }
      
      return res;
    } catch (err) {
      console.error('Network Error in AuthFetch:', err);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    login: handleLogin,
    logout: handleLogout,
    authFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
