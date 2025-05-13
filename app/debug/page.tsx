'use client';

import React, { useState, useEffect } from 'react';
import { db, seedDatabase, resetSeedFlag } from '../lib/db/localDb';
import { UserRole } from '../models/User';
import Link from 'next/link';
import localOrganizationService from '../lib/services/localOrganizationService';

export default function DebugPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Form data for creating admin
  const [formData, setFormData] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    organizationName: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const allUsers = await db.users.toArray();
        const allOrgs = await db.organizations.toArray();
        setUsers(allUsers);
        setOrganizations(allOrgs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleClearDatabase = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      // Reset the seed flag first to ensure we can re-seed later
      resetSeedFlag();
      await db.delete();
      setMessage('Database cleared successfully. Please refresh the page to create a new database.');
      setUsers([]);
      setOrganizations([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear database');
      console.error('Error clearing database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      await seedDatabase(true); // Force re-seed
      const allUsers = await db.users.toArray();
      const allOrgs = await db.organizations.toArray();
      setUsers(allUsers);
      setOrganizations(allOrgs);
      setMessage('Database seeded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed database');
      console.error('Error seeding database:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setMessage(null);
      
      // Validate form data
      if (!formData.adminName || !formData.adminEmail || !formData.adminPassword || !formData.organizationName) {
        throw new Error('All fields are required');
      }
      
      // Create organization with admin user
      const result = await localOrganizationService.generateUniqueCode();
      
      // Create organization
      const orgId = await db.organizations.add({
        name: formData.organizationName,
        code: result,
        adminUserId: 0, // Will update after creating admin
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create admin user
      const adminId = await db.users.add({
        name: formData.adminName,
        email: formData.adminEmail,
        password: '$2a$10$vQPLj5mIiw9oHO0Dfb5DA.1EGBd2MJfCreVrb9pdnHnaBVYXCeE5a', // hashed 'password123'
        role: UserRole.ADMIN,
        isActive: true,
        organizationId: orgId,
        organizationCode: result,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update organization with admin ID
      await db.organizations.update(orgId, {
        adminUserId: adminId
      });
      
      // Refresh data
      const allUsers = await db.users.toArray();
      const allOrgs = await db.organizations.toArray();
      setUsers(allUsers);
      setOrganizations(allOrgs);
      
      // Clear form
      setFormData({
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        organizationName: ''
      });
      
      setMessage(`Admin user created with organization code: ${result}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin user');
      console.error('Error adding admin user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting an organization
  const handleDeleteOrganization = async (id: number) => {
    try {
      setIsLoading(true);
      setMessage(null);
      setError(null);
      
      // First, check if the organization exists
      const org = await db.organizations.get(id);
      if (!org) {
        throw new Error(`Organization with ID ${id} not found`);
      }
      
      // Delete all users associated with this organization
      await db.users.where('organizationId').equals(id).delete();
      
      // Delete the organization itself
      await db.organizations.delete(id);
      
      // Refresh data
      const allUsers = await db.users.toArray();
      const allOrgs = await db.organizations.toArray();
      setUsers(allUsers);
      setOrganizations(allOrgs);
      
      setMessage(`Organization ${org.name} (ID: ${id}) and all its users have been deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete organization with ID ${id}`);
      console.error(`Error deleting organization ${id}:`, err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle deleting a user
  const handleDeleteUser = async (id: number) => {
    try {
      setIsLoading(true);
      setMessage(null);
      setError(null);
      
      // First, check if the user exists
      const user = await db.users.get(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      // Check if this user is an admin of an organization
      if (user.role === UserRole.ADMIN && user.organizationId) {
        const org = await db.organizations.get(user.organizationId);
        if (org && org.adminUserId === id) {
          throw new Error(`Cannot delete user ${id} as they are the admin of organization ${org.name}. Delete the organization instead.`);
        }
      }
      
      // Delete the user
      await db.users.delete(id);
      
      // Refresh data
      const allUsers = await db.users.toArray();
      setUsers(allUsers);
      
      setMessage(`User ${user.name} (ID: ${id}) has been deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete user with ID ${id}`);
      console.error(`Error deleting user ${id}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setIsLoading(true);
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing page:', error);
    }
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>ERP-IITR Debug Page</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'block' }}>
          Back to Home
        </Link>
        <button onClick={refresh} style={{ padding: '5px 10px' }}>
          Refresh Page
        </button>
      </div>
      
      {error && (
        <div style={{ padding: '10px', background: '#ffebee', marginBottom: '20px', color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {message && (
        <div style={{ padding: '10px', background: '#e8f5e9', marginBottom: '20px', color: 'green' }}>
          <strong>Success:</strong> {message}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Database Operations</h3>
        <button 
          onClick={handleSeedDatabase}
          disabled={isLoading}
          style={{ marginRight: '10px', padding: '8px 16px', background: '#e3f2fd' }}
        >
          Seed/Reset Database
        </button>
        
        <button 
          onClick={handleClearDatabase}
          disabled={isLoading}
          style={{ padding: '8px 16px', background: '#ffcdd2' }}
        >
          Clear Database
        </button>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Create Admin User with Organization</h3>
        <form onSubmit={handleAddAdminUser} style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Organization Name:</label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              disabled={isLoading}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Company name"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Admin Name:</label>
            <input
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              disabled={isLoading}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Admin's full name"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Admin Email:</label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              disabled={isLoading}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Admin's email address"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Admin Password:</label>
            <input
              type="password"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleChange}
              disabled={isLoading}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Password (will be hashed to 'password123' for demo)"
            />
            <small style={{ color: '#777', display: 'block', marginTop: '5px' }}>
              Note: For demo purposes, all passwords are set to "password123" regardless of what you enter
            </small>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ padding: '8px 16px', background: '#bbdefb', marginRight: '10px' }}
          >
            Create Admin with Organization
          </button>
        </form>
      </div>
      
      <h2>Organizations ({organizations.length})</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : organizations.length === 0 ? (
        <div style={{ padding: '10px', background: '#fff3e0', marginBottom: '20px' }}>
          <p><strong>No organizations found in the database.</strong></p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Code</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Admin ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Active</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map(org => (
              <tr key={org.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{org.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{org.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>{org.code}</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{org.adminUserId}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{org.isActive ? 'Yes' : 'No'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => handleDeleteOrganization(org.id)}
                    disabled={isLoading}
                    style={{ 
                      padding: '4px 8px', 
                      background: '#ffcdd2', 
                      border: '1px solid #ef9a9a',
                      borderRadius: '4px',
                      cursor: 'pointer' 
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <h2>Users in Database ({users.length})</h2>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <div style={{ padding: '10px', background: '#fff3e0', marginBottom: '20px' }}>
          <p><strong>No users found in the database.</strong></p>
          <p>Click the "Seed/Reset Database" button above to populate the database with initial data.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Role</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Org ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Org Code</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Active</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.role}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.organizationId}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.organizationCode}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.isActive ? 'Yes' : 'No'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={isLoading || user.role === UserRole.ADMIN}
                    title={user.role === UserRole.ADMIN ? "To delete an admin user, delete the organization instead" : "Delete this user"}
                    style={{ 
                      padding: '4px 8px', 
                      background: user.role === UserRole.ADMIN ? '#e0e0e0' : '#ffcdd2', 
                      border: '1px solid ' + (user.role === UserRole.ADMIN ? '#bdbdbd' : '#ef9a9a'),
                      borderRadius: '4px',
                      cursor: user.role === UserRole.ADMIN ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h3>Database Troubleshooting</h3>
        <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
          <p>
            This application uses IndexedDB (via Dexie.js) to store data in your browser. 
            If you're having issues, try the following:
          </p>
          <ol>
            <li>Click the "Seed/Reset Database" button above to reset the database</li>
            <li>If that doesn't work, try clicking "Clear Database" followed by refreshing the page and then "Seed/Reset Database"</li>
            <li>Make sure your browser allows IndexedDB storage (check privacy settings)</li>
            <li>Try using a different browser if issues persist</li>
            <li>Check browser console for any error messages (F12 or Cmd+Option+I)</li>
          </ol>
          <p><strong>Note:</strong> All passwords are set to "password123" for demo purposes.</p>
        </div>
      </div>
    </div>
  );
} 