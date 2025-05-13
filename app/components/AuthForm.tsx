'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserLoginType } from '../lib/contexts/AuthContext';
import { UserRole } from '../models/User';

type AuthMode = 'login' | 'register';

interface FormData {
  name: string;
  email: string;
  password: string;
  organizationCode: string;
  organizationName: string;
}

export default function AuthForm() {
  const { login, register, error: authError, isLoading, loginType, setLoginType } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    organizationCode: '',
    organizationName: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Update local error state when auth error changes
  useEffect(() => {
    setError(authError);
  }, [authError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginTypeChange = (type: UserLoginType) => {
    setLoginType(type);
    setError(null);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validation
      if (mode === 'register') {
        if (!formData.name) {
          throw new Error('Name is required');
        }
        if (!formData.organizationName) {
          throw new Error('Organization name is required');
        }
      }

      if (!formData.email) {
        throw new Error('Email is required');
      }

      if (!formData.password) {
        throw new Error('Password is required');
      }

      if (mode === 'login' && loginType !== 'admin' && !formData.organizationCode) {
        throw new Error('Organization code is required');
      }

      // Perform authentication
      if (mode === 'login') {
        if (loginType === 'admin') {
          await login(formData.email, formData.password);
        } else {
          await login(formData.email, formData.password, formData.organizationCode);
        }
      } else {
        // Only admin registration is supported
        await register(formData.name, formData.email, formData.password, formData.organizationName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  return (
    <div className="auth-form-container">
      {mode === 'login' && (
        <div className="login-type-selector">
          <button 
            className={`login-type-button ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('admin')}
          >
            Admin
          </button>
          <button 
            className={`login-type-button ${loginType === 'manager' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('manager')}
          >
            Manager
          </button>
          <button 
            className={`login-type-button ${loginType === 'basic' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('basic')}
          >
            Basic
          </button>
        </div>
      )}

      <h2>
        {mode === 'login' 
          ? `${loginType.charAt(0).toUpperCase() + loginType.slice(1)} Login` 
          : 'Register Organization Admin Account'}
      </h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <div className="form-group">
              <label htmlFor="name">Admin Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="organizationName">Organization Name</label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Company name"
              />
            </div>
          </>
        )}
        
        {mode === 'login' && (
          <div className={`form-group ${loginType === 'admin' ? 'hidden-field' : ''}`}>
            <label htmlFor="organizationCode">Organization Code</label>
            <input
              type="text"
              id="organizationCode"
              name="organizationCode"
              value={formData.organizationCode}
              onChange={handleChange}
              disabled={isLoading || loginType === 'admin'}
              placeholder="Enter your organization code"
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Your email address"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Your password"
          />
        </div>
        
        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
      
      <div className="auth-toggle">
        {mode === 'login' && loginType === 'admin' && (
          <button onClick={toggleMode} disabled={isLoading} className="toggle-button">
            Need to register an organization? Register
          </button>
        )}
        {mode === 'register' && (
          <button onClick={toggleMode} disabled={isLoading} className="toggle-button">
            Already have an account? Login
          </button>
        )}
      </div>

      <div className="auth-info">
        {mode === 'login' && loginType !== 'admin' && (
          <p className="auth-info-text">
            Contact your organization's admin to get the organization code.
          </p>
        )}
        {mode === 'login' && loginType === 'admin' && !formData.email && (
          <p className="auth-info-text">
            As an admin, you manage your organization and create manager/basic user accounts.
          </p>
        )}
        {mode === 'register' && (
          <p className="auth-info-text">
            Registering creates a new organization with you as the admin user.
            You'll receive a unique organization code after registration.
          </p>
        )}
      </div>
    </div>
  );
} 