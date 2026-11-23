// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/leadService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        authService.validateToken()
          .then(() => {
            setUser(userData);
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
  const normRole = (r) => String(r || '').trim().toUpperCase().replace(/[-\s]+/g, '_').replace(/^ROLE_/, '');

  const login = async (username, password) => {
    try {
      const response = await authService.login((username || '').trim(), password);

      // This portal is for Super Admin / Admin only. A telecaller (or plain USER)
      // account logs in fine on the server but every admin API then answers 403,
      // which used to throw the person straight back to the login page.
      if (!ADMIN_ROLES.includes(normRole(response.role))) {
        return {
          success: false,
          error: 'This portal is for Super Admin / Admin accounts only. Telecallers must use the Telecaller portal.',
        };
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        username: response.username,
        fullName: response.fullName,
        role: response.role
      }));
      setUser({
        username: response.username,
        fullName: response.fullName,
        role: response.role
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore errors during logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      await authService.register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


