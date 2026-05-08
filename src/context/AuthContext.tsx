'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SafeUser } from '@/lib/types';

interface AuthContextType {
  user: SafeUser | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: SafeUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('mediashare_token');
    const storedUser = localStorage.getItem('mediashare_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('mediashare_token');
        localStorage.removeItem('mediashare_user');
      }
    }
    setMounted(true);
  }, []);

  const login = useCallback((newUser: SafeUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('mediashare_token', newToken);
    localStorage.setItem('mediashare_user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mediashare_token');
    localStorage.removeItem('mediashare_user');
  }, []);

  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
