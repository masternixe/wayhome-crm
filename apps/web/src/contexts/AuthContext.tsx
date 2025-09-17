'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/services/apiService';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  officeId?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Token management
  const getStoredTokens = (): AuthTokens | null => {
    if (typeof window === 'undefined') return null;
    
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!accessToken || !refreshToken) return null;
    
    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? parseInt(expiresAt) : Date.now() + (60 * 60 * 1000) // default 1 hour
    };
  };

  const setStoredTokens = (tokens: { accessToken: string; refreshToken: string; expiresIn?: number }) => {
    const expiresAt = Date.now() + (tokens.expiresIn ? tokens.expiresIn * 1000 : 60 * 60 * 1000); // default 1 hour
    
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    localStorage.setItem('token_expires_at', expiresAt.toString());
  };

  const clearStoredTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('user');
  };

  const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  };

  const setStoredUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  };

  // Check if token is about to expire (within 5 minutes)
  const isTokenExpiringSoon = (expiresAt: number): boolean => {
    return Date.now() >= (expiresAt - 5 * 60 * 1000); // 5 minutes before expiry
  };

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const tokens = getStoredTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing access token...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.data.tokens) {
        console.log('✅ Token refreshed successfully');
        setStoredTokens({
          accessToken: data.data.tokens.accessToken,
          refreshToken: data.data.tokens.refreshToken || tokens.refreshToken,
          expiresIn: data.data.tokens.expiresIn
        });
        return true;
      } else {
        throw new Error(data.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // If refresh fails, logout user
      logout();
      return false;
    }
  }, []);

  // Get valid token (refresh if needed)
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const tokens = getStoredTokens();
    if (!tokens) return null;

    // If token is expiring soon, refresh it
    if (isTokenExpiringSoon(tokens.expiresAt)) {
      console.log('⏰ Token expiring soon, refreshing...');
      const refreshed = await refreshToken();
      if (!refreshed) return null;
      
      // Get the new token
      const newTokens = getStoredTokens();
      return newTokens?.accessToken || null;
    }

    return tokens.accessToken;
  }, [refreshToken]);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data.user && data.data.tokens) {
        console.log('✅ Login successful');
        
        // Store tokens and user
        setStoredTokens({
          accessToken: data.data.tokens.accessToken,
          refreshToken: data.data.tokens.refreshToken,
          expiresIn: data.data.tokens.expiresIn
        });
        setStoredUser(data.data.user);
        setUser(data.data.user);
        
        // Redirect to dashboard
        router.replace('/crm/dashboard');
        
        return true;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    console.log('👋 Logging out...');
    
    clearStoredTokens();
    setUser(null);
    router.replace('/crm');
  }, [router]);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const storedUser = getStoredUser();
      const tokens = getStoredTokens();
      
      if (!storedUser || !tokens) {
        setUser(null);
        return;
      }

      // Validate token by trying to get a valid one
      const validToken = await getValidToken();
      if (!validToken) {
        setUser(null);
        clearStoredTokens();
        return;
      }

      // Verify token with server
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('✅ Session validated');
          setUser(data.data);
          setStoredUser(data.data); // Update stored user with fresh data
        } else {
          throw new Error('Invalid session');
        }
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          throw new Error('Session expired');
        }
        // Retry with new token
        await checkAuth();
      } else {
        throw new Error('Session validation failed');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      clearStoredTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getValidToken, refreshToken]);

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up API service with auth methods
  useEffect(() => {
    apiService.setAuthMethods(getValidToken, logout, refreshToken);
  }, [getValidToken, logout, refreshToken]);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const tokens = getStoredTokens();
      if (tokens && isTokenExpiringSoon(tokens.expiresAt)) {
        console.log('⏰ Auto-refreshing token...');
        await refreshToken();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // Handle window focus (check session when user returns)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('👀 Window focused, checking session...');
        checkAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    getValidToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
