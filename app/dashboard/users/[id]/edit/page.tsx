'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Building, 
  Users, 
  Shield, 
  Save, 
  ArrowLeft, 
  AlertCircle 
} from 'lucide-react';

import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { UserRole } from '@/app/models/User';
import { LocalUser, LocalOrganization, LocalDepartment } from '@/app/lib/db/localDb';
import localUserService from '@/app/lib/services/localUserService';
import localOrganizationService from '@/app/lib/services/localOrganizationService';
import departmentService from '@/app/lib/services/departmentService';
import PermissionsManager from '@/app/components/users/PermissionsManager';
import { ModulePermission } from '@/app/models/Permission';
import permissionService from '@/app/lib/services/permissionService';

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = parseInt(params.id);
  
  // Form data state
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    isActive: boolean;
    organizationId: number | null;
    organizationCode: string;
    departmentId: number | null;
    managerId: number | null;
  }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.BASIC,
    isActive: true,
    organizationId: null,
    organizationCode: '',
    departmentId: null,
    managerId: null
  });
  
  // Options state
  const [organizations, setOrganizations] = useState<LocalOrganization[]>([]);
  const [departments, setDepartments] = useState<LocalDepartment[]>([]);
  const [managers, setManagers] = useState<LocalUser[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // New state for permissions
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  
  // Fetch user data and dropdown options
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Check if the current user has permission to edit this user
        if (!currentUser || 
            (currentUser.role !== UserRole.ADMIN && 
             currentUser.role !== UserRole.MANAGER && 
             currentUser.id !== userId)) {
          router.push('/dashboard');
          return;
        }
        
        // Load user
        const userData = await localUserService.getById(userId);
        if (!userData) {
          setErrorMessage('User not found');
          return;
        }
        
        // Populate form with user data
        setFormData({
          name: userData.name,
          email: userData.email,
          password: '',
          confirmPassword: '',
          role: userData.role,
          isActive: userData.isActive,
          organizationId: userData.organizationId || null,
          organizationCode: userData.organizationCode || '',
          departmentId: userData.departmentId || null,
          managerId: userData.managerId || null
        });
        
        // Load organizations for dropdown
        if (currentUser.role === UserRole.ADMIN) {
          const orgs = await localOrganizationService.getAll();
          setOrganizations(orgs);
        } else if (currentUser.role === UserRole.MANAGER && currentUser.organizationId) {
          const org = await localOrganizationService.getById(currentUser.organizationId);
          setOrganizations(org ? [org] : []);
        }
        
        // Load departments based on organization
        if (userData.organizationId) {
          const depts = await departmentService.departmentService.getByOrganization(userData.organizationId);
          setDepartments(depts);
        }
        
        // Load managers for dropdown
        const managersData = await localUserService.getByRole(UserRole.MANAGER);
        setManagers(managersData);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Failed to load user information');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      loadUserData();
    }
  }, [userId, router, currentUser]);
  
  // Handle organization change
  const handleOrganizationChange = async (orgId: number | null) => {
    setFormData(prev => ({
      ...prev,
      organizationId: orgId,
      departmentId: null  // Reset department when organization changes
    }));
    
    // Load departments for selected organization
    if (orgId) {
      try {
        const depts = await departmentService.departmentService.getByOrganization(orgId);
        setDepartments(depts);
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    } else {
      setDepartments([]);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkboxInput = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkboxInput.checked
      }));
    } else if (name === 'organizationId') {
      const orgId = value ? parseInt(value) : null;
      handleOrganizationChange(orgId);
    } else if (name === 'departmentId' || name === 'managerId') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Password matching (only if password is provided)
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle permissions change
  const handlePermissionsChange = (updatedPermissions: ModulePermission[]) => {
    setPermissions(updatedPermissions);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage(null);
    setErrorMessage(null);
    
    // Validate form
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      // Prepare user data
      const userData: Partial<LocalUser> = {
        id: userId,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        organizationId: formData.organizationId || undefined,
        organizationCode: formData.organizationCode || undefined,
        departmentId: formData.departmentId || undefined,
        managerId: formData.managerId || undefined,
        updatedAt: new Date()
      };
      
      // Only include password if it was changed
      if (formData.password) {
        userData.password = formData.password;
      }
      
      // Update user
      await localUserService.update(userId, userData);
      
      // If it's a Basic user, save permissions
      if (formData.role === UserRole.BASIC && permissions.length > 0) {
        // First delete existing permissions
        await permissionService.deleteByUserId(userId);
        
        // Save each permission
        for (const permission of permissions) {
          await permissionService.create({
            userId,
            moduleId: permission.moduleId,
            canView: permission.canView
          });
        }
      }
      
      setSuccessMessage('User updated successfully');
      
      // Redirect to user details page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/users/${userId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating user:', error);
      setErrorMessage('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Navigate back to user detail
  const handleBack = () => {
    router.push(`/dashboard/users/${userId}`);
  };
  
  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Edit User">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading user information...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (errorMessage && !formData.name) {
    return (
      <DashboardLayout pageTitle="Edit User">
        <div className="p-6">
          <div className="bg-red-50 p-4 rounded-md flex items-start mb-6">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              <button
                onClick={() => router.push('/dashboard/users')}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
              >
                Return to Users List
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout pageTitle={`Edit User: ${formData.name}`}>
      <div className="user-form-container">
        <div className="user-form-header">
          <button
            onClick={handleBack}
            className="back-button"
          >
            <ArrowLeft />
          </button>
          <h2 className="user-form-title">
            <User className="user-form-title-icon" />
            Edit User
          </h2>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="message-box message-box-success">
            <div className="message-box-icon">
              <AlertCircle />
            </div>
            <div className="message-box-content">
              <h3 className="message-box-title">Success</h3>
              <p className="message-box-message">{successMessage}</p>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <div className="message-box message-box-error">
            <div className="message-box-icon">
              <AlertCircle />
            </div>
            <div className="message-box-content">
              <h3 className="message-box-title">Error</h3>
              <p className="message-box-message">{errorMessage}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="user-form-card">
          {/* User Information Section */}
          <div className="user-form-section">
            <h3 className="user-form-section-title">User Information</h3>
            <div className="form-field">
              <label htmlFor="name" className="form-field-label">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-field-input ${errors.name ? 'error' : ''}`}
                required
              />
              {errors.name && (
                <p className="form-field-error">{errors.name}</p>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="email" className="form-field-label">
                Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-field-input ${errors.email ? 'error' : ''}`}
                  required
                />
              </div>
              {errors.email && (
                <p className="form-field-error">{errors.email}</p>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="password" className="form-field-label">
                Password (leave empty to keep current)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-field-input"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-field-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`form-field-input ${errors.confirmPassword ? 'error' : ''}`}
              />
              {errors.confirmPassword && (
                <p className="form-field-error">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
          
          {/* Role and Status Section */}
          <div className="user-form-section">
            <h3 className="user-form-section-title">Role and Status</h3>
            <div className="user-form-grid">
              <div className="form-field">
                <label htmlFor="role" className="form-field-label">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-field-select"
                  disabled={currentUser?.role !== UserRole.ADMIN}
                >
                  <option value={UserRole.BASIC}>Basic</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  {currentUser?.role === UserRole.ADMIN && (
                    <option value={UserRole.ADMIN}>Admin</option>
                  )}
                </select>
                {currentUser?.role !== UserRole.ADMIN && (
                  <p className="form-field-hint">Only admins can change user roles</p>
                )}
              </div>
              
              <div className="form-field">
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="form-field-checkbox"
                  />
                  <label htmlFor="isActive" className="form-field-label mb-0">
                    Active User
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Organization Section */}
          <div className="user-form-section">
            <h3 className="user-form-section-title">Organization</h3>
            
            <div className="form-field">
              <label htmlFor="organizationId" className="form-field-label">
                Organization
              </label>
              <select
                id="organizationId"
                name="organizationId"
                value={formData.organizationId || ''}
                onChange={handleInputChange}
                className="form-field-select"
                disabled={currentUser?.role !== UserRole.ADMIN && currentUser?.id !== userId}
              >
                <option value="">Select Organization</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-field">
              <label htmlFor="organizationCode" className="form-field-label">
                Organization Code (Optional)
              </label>
              <input
                type="text"
                id="organizationCode"
                name="organizationCode"
                value={formData.organizationCode}
                onChange={handleInputChange}
                className="form-field-input"
              />
            </div>
          </div>
          
          {/* Department and Manager Section */}
          <div className="user-form-section">
            <h3 className="user-form-section-title">Department and Reporting</h3>
            <div className="user-form-grid">
              <div className="form-field">
                <label htmlFor="departmentId" className="form-field-label">
                  Department
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId || ''}
                  onChange={handleInputChange}
                  className="form-field-select"
                  disabled={!formData.organizationId}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {!formData.organizationId && (
                  <p className="form-field-hint">Select an organization first</p>
                )}
              </div>
              
              {formData.role !== UserRole.ADMIN && (
                <div className="form-field">
                  <label htmlFor="managerId" className="form-field-label">
                    Manager
                  </label>
                  <select
                    id="managerId"
                    name="managerId"
                    value={formData.managerId || ''}
                    onChange={handleInputChange}
                    className="form-field-select"
                  >
                    <option value="">Select Manager</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                  <p className="form-field-hint">Select the manager for this user</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Module Permissions for Basic Users */}
          {formData.role === UserRole.BASIC && (
            <div className="user-form-section">
              <h3 className="user-form-section-title">Module Permissions</h3>
              <p className="user-form-section-description">
                Specify which modules this user can access.
              </p>
              <PermissionsManager
                userId={userId}
                userRole={formData.role}
                onChange={handlePermissionsChange}
              />
            </div>
          )}
          
          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleBack}
              className="form-button form-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="form-button form-button-primary"
              disabled={isSaving}
            >
              <Save className="form-button-icon" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 