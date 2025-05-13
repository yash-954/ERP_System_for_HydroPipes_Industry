'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/contexts/AuthContext';
import localUserService from '../lib/services/localUserService';
import { LocalUser } from '../lib/db/localDb';
import { UserRole } from '../models/User';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New user form state
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.BASIC
  });

  // Load users data
  useEffect(() => {
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only admin and manager can access this page
    if (currentUser && 
        currentUser.role !== UserRole.ADMIN && 
        currentUser.role !== UserRole.MANAGER) {
      router.push('/dashboard');
      return;
    }

    // Fetch users
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const data = await localUserService.getAll();
        setUsers(data);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }
  }, [authLoading, isAuthenticated, router, currentUser]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Validate form
      if (!newUser.name || !newUser.email || !newUser.password) {
        setError('All fields are required');
        return;
      }

      // Create user
      await localUserService.create({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: UserRole.BASIC
      });
      setShowForm(false);

      // Refresh user list
      const data = await localUserService.getAll();
      setUsers(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (id: number) => {
    try {
      // Prevent deleting current user
      if (currentUser?.id === id) {
        setError('You cannot delete your own account');
        return;
      }

      setIsLoading(true);
      await localUserService.delete(id);
      
      // Refresh user list
      const data = await localUserService.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (id: number, role: UserRole) => {
    try {
      setIsLoading(true);
      await localUserService.changeRole(id, role);
      
      // Refresh user list
      const data = await localUserService.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to change user role');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (id: number) => {
    try {
      setIsLoading(true);
      await localUserService.toggleActive(id);
      
      // Refresh user list
      const data = await localUserService.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!currentUser && isAuthenticated)) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={() => router.push('/dashboard')}
          >
            &larr; Back to Dashboard
          </button>
          <h1>User Management</h1>
        </div>
        <button 
          className="add-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="error-close"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      {showForm && (
        <div className="user-form-container">
          <h2>Add New User</h2>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select 
                id="role" 
                name="role" 
                value={newUser.role}
                onChange={handleInputChange}
              >
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.MANAGER}>Manager</option>
                <option value={UserRole.SALES}>Sales</option>
                <option value={UserRole.PURCHASE}>Purchase</option>
                <option value={UserRole.INVENTORY}>Inventory</option>
                <option value={UserRole.ACCOUNTING}>Accounting</option>
                <option value={UserRole.BASIC}>Basic</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      <div className="users-container">
        {isLoading ? (
          <div className="loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users found</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.id === currentUser?.id ? 'current-user' : ''}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {currentUser?.role === UserRole.ADMIN ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id!, e.target.value as UserRole)}
                        disabled={user.id === currentUser?.id || isLoading}
                      >
                        <option value={UserRole.ADMIN}>Admin</option>
                        <option value={UserRole.MANAGER}>Manager</option>
                        <option value={UserRole.SALES}>Sales</option>
                        <option value={UserRole.PURCHASE}>Purchase</option>
                        <option value={UserRole.INVENTORY}>Inventory</option>
                        <option value={UserRole.ACCOUNTING}>Accounting</option>
                        <option value={UserRole.BASIC}>Basic</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td>
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    <button
                      className={`status-button ${user.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleStatusToggle(user.id!)}
                      disabled={user.id === currentUser?.id || isLoading}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteUser(user.id!)}
                      disabled={user.id === currentUser?.id || isLoading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="demo-indicator">
        <div className="demo-badge">Demo Mode</div>
        <p className="demo-note">Using local storage database. All changes will persist in your browser.</p>
      </div>
    </div>
  );
} 