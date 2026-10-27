'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserDto } from '@/lib/types/auth';
import { authApi } from '@/lib/api-client';

interface AuthContextType {
  user: UserDto | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthSession: (accessToken: string, user: UserDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent session restore on mount (reads HttpOnly refresh_token cookie)
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const response = await authApi.refreshToken();
        if (isMounted && response.success && response.data) {
          setAccessToken(response.data.accessToken);
          setUser(response.data.user);
        }
      } catch {
        // User is not authenticated or refresh token expired
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async () => {
    try {
      const response = await authApi.getLoginUrl();
      if (response.success && response.data.loginUrl) {
        window.location.href = response.data.loginUrl;
      }
    } catch (error) {
      console.error('Failed to initiate GitHub login:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      window.location.href = '/';
    }
  }, []);

  const setAuthSession = useCallback((token: string, userData: UserDto) => {
    setAccessToken(token);
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setAuthSession,
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
