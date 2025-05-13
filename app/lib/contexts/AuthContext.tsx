'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import localUserService from '../services/localUserService';
import { LocalUser, db, seedDatabase } from '../db/localDb';
import { UserRole } from '../../models/User';
import useDatabase from '../../hooks/useDatabase';

// Define types
type AuthUser = Omit<LocalUser, 'password'>;

export type UserLoginType = 'admin' | 'manager' | 'basic';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  loginType: UserLoginType;
  setLoginType: (type: UserLoginType) => void;
  login: (email: string, password: string, organizationCode?: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
  createUserByAdmin: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  createUserByManager: (name: string, email: string, password: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<UserLoginType>('admin');
  const router = useRouter();
  const { isInitialized, error: dbError } = useDatabase();

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // If database isn't initialized yet, or has an error, wait for it
      if (!isInitialized) {
        console.log('Waiting for database initialization...');
        return;
      }
      
      if (dbError) {
        console.error('Database error:', dbError);
        setError(`Database error: ${dbError.message}`);
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Decode the token to get user info
          const decodedToken = JSON.parse(atob(token));
          
          // Check if token is expired
          if (decodedToken.exp < Math.floor(Date.now() / 1000)) {
            // Token expired, clear it
            localStorage.removeItem('token');
            setUser(null);
          } else {
            // Get user data from token
            const userData = await localUserService.getById(decodedToken.id);
            if (userData) {
              const { password: _, ...userWithoutPassword } = userData;
              setUser(userWithoutPassword);
            } else {
              // User not found or deleted
              localStorage.removeItem('token');
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isInitialized, dbError]);

  // Login function with organization code support
  const login = async (email: string, password: string, organizationCode?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let result;
      
      if (loginType === 'admin') {
        // Admin login doesn't require organization code
        result = await localUserService.authenticate(email, password);
      } else {
        // Manager or Basic login requires organization code
        if (!organizationCode) {
          throw new Error('Organization code is required');
        }
        result = await localUserService.authenticateWithOrgCode(email, password, organizationCode);
      }
      
      if (result) {
        localStorage.setItem('token', result.token);
        setUser(result.user);
        router.push('/dashboard');
      } else {
        if (loginType === 'admin') {
          setError('Invalid email or password for admin login');
        } else {
          setError('Invalid email, password, or organization code');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function (admin only, creates a new organization)
  const register = async (name: string, email: string, password: string, organizationName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Create organization with admin
      const result = await localUserService.createOrganizationWithAdmin(
        organizationName,
        name,
        email,
        password
      );
      
      console.log(`Created organization ${result.organizationId} with admin ${result.adminId} and code ${result.organizationCode}`);
      
      // Login the new admin
      await login(email, password);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create user by admin (can create manager or basic users)
  const createUserByAdmin = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);
    
    if (!user || !user.id || !user.organizationId || user.role !== UserRole.ADMIN) {
      setError('You must be logged in as an admin to create users');
      setIsLoading(false);
      return;
    }
    
    // Only allow creating manager or basic users
    if (role === UserRole.ADMIN) {
      setError('Cannot create another admin user');
      setIsLoading(false);
      return;
    }
    
    try {
      // Create the user with the current organization
      const userId = await localUserService.create({
        name,
        email,
        password,
        role,
        isActive: true,
        organizationId: user.organizationId,
        organizationCode: user.organizationCode
      });
      
      console.log(`Admin created a new ${role} user with ID: ${userId}`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the user');
      console.error('User creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create user by manager (can only create basic users)
  const createUserByManager = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    if (!user || !user.id || !user.organizationId || user.role !== UserRole.MANAGER) {
      setError('You must be logged in as a manager to create users');
      setIsLoading(false);
      return;
    }
    
    try {
      // Create the basic user with the current organization
      const userId = await localUserService.create({
        name,
        email,
        password,
        role: UserRole.BASIC,
        isActive: true,
        organizationId: user.organizationId,
        organizationCode: user.organizationCode
      });
      
      console.log(`Manager created a new basic user with ID: ${userId}`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the user');
      console.error('User creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  // Context value
  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginType,
    setLoginType,
    login,
    register,
    logout,
    createUserByAdmin,
    createUserByManager
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 