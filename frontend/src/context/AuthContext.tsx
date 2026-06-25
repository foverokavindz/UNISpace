// ============================================================
// src/context/AuthContext.tsx
// Global authentication state using React Context
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { getCurrentUser } from '../services/auth.service';

// Shape of the context value
interface AuthContextType {
  user: User | null;           // currently logged-in user (or null)
  token: string | null;        // JWT token
  isLoading: boolean;          // true while checking if user is already logged in
  login: (token: string, user: User) => void;   // called after successful login
  logout: () => void;          // clears auth state
  setUser: (user: User) => void; // update user state (e.g. after profile edit)
}

// Create context with undefined default (checked in useAuth)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------------------------------------------------
// AuthProvider — wraps the entire app
// ----------------------------------------------------------
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // starts true to check sessionStorage

  // On mount, check if a token exists in sessionStorage
  // and fetch the user profile to restore the session.
  // sessionStorage is per-tab, so each tab keeps its own independent session.
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = sessionStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token invalid — clear storage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
        } catch {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Called after successful login or registration
  const login = (newToken: string, newUser: User) => {
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Clears all auth state
  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ----------------------------------------------------------
// useAuth — custom hook to consume the auth context
// Usage: const { user, login, logout } = useAuth();
// ----------------------------------------------------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
};
