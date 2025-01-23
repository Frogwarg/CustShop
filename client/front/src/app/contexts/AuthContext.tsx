'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  hasRole: (role: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const hasRole = (role: string) => {
    return authService.hasRole(role);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, hasRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};