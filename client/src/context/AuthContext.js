'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('voiceapp_token');
    const savedUser = localStorage.getItem('voiceapp_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      connectSocket(savedToken);
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('voiceapp_token', newToken);
    localStorage.setItem('voiceapp_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    connectSocket(newToken);
  }, []);

  const updateUser = useCallback((userData) => {
    localStorage.setItem('voiceapp_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('voiceapp_token');
    localStorage.removeItem('voiceapp_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      updateUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      if (error.message.includes('401') || error.message.includes('token')) {
        logout();
      }
    }
  }, [updateUser, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        refreshProfile,
        isAuthenticated: !!token,
        isProfileComplete: user?.isProfileComplete ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
