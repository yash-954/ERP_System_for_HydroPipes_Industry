'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, ArrowLeft, Save, AlertCircle, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { LocalUser } from '@/app/lib/db/localDb';
import { UserRole } from '@/app/models/User';
import localUserService from '@/app/lib/services/localUserService';
import localOrganizationService from '@/app/lib/services/localOrganizationService';
import departmentService from '@/app/lib/services/departmentService';
import PermissionsManager from '@/app/components/users/PermissionsManager';
import { ModulePermission } from '@/app/models/Permission';
import permissionService from '@/app/lib/services/permissionService';
import { generateSecurePassword } from '@/app/lib/utils/passwordUtils';

export default function CreateUserPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.BASIC,
    organizationId: '',
    departmentId: '',
    managerId: '',
    organizationCode: '',
    isActive: true
  });
  
  // Add new state for password
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordGenerated, setIsPasswordGenerated] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Options for dropdowns
  const [organizations, setOrganizations] = useState<{ id: number, name: string, code: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number, name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: number, name: string }[]>([]);
  
  // Add state for permissions
  const [userPermissions, setUserPermissions] = useState<ModulePermission[]>([]);
  
  // Generate a secure password
  const generatePassword = () => {
    const password = generateSecurePassword(10);
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }));
    setIsPasswordGenerated(true);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Copy password to clipboard
  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(formData.password);
    setIsCopied(true);
    
    // Reset copy indicator after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  // Load options for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check if the current user has permission to create users
        if (!currentUser || 
            (currentUser.role !== UserRole.ADMIN && 
             currentUser.role !== UserRole.MANAGER)) {
          router.push('/dashboard');
          return;
        }
        
        // Load organization information for the current user
        if (currentUser.organizationId) {
          // Get the current user's organization
          const org = await localOrganizationService.getById(currentUser.organizationId);
          
          if (org) {
            // Auto-fill the organization in the form and disable editing
            setFormData(prev => ({
              ...prev,
              organizationId: org.id ? org.id.toString() : '',
              organizationCode: org.code || currentUser.organizationCode || ''
            }));
            
            // Set the organizations array with just the current organization
            setOrganizations([{ id: org.id, name: org.name, code: org.code }]);
          }
        } else {
          // User has no organization, load all organizations
          const orgs = await localOrganizationService.getAll();
          setOrganizations(orgs.map(org => ({ id: org.id, name: org.name, code: org.code })));
        }
        
        const depts = await departmentService.departmentService.getAll();
        setDepartments(depts.map(dept => ({ id: dept.id, name: dept.name })));
        
        // Load potential managers (users with MANAGER or ADMIN role in the same organization)
        const allUsers = await localUserService.getAll();
        const potentialManagers = allUsers.filter(u => 
          (u.role === UserRole.MANAGER || u.role === UserRole.ADMIN) &&
          u.organizationId === currentUser.organizationId
        );
        setManagers(potentialManagers.map(m => ({ id: m.id, name: m.name })));
        
        // Generate a default password when the component loads
        generatePassword();
        
      } catch (error) {
        console.error('Error loading dropdown options:', error);
        setError('Failed to load form options');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router, currentUser]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // When organization is selected, fetch and set the organization code
    if (name === 'organizationId' && value) {
      const selectedOrgId = parseInt(value);
      const selectedOrg = organizations.find(org => org.id === selectedOrgId);
      
      if (selectedOrg && selectedOrg.code) {
        setFormData(prev => ({
          ...prev,
          organizationCode: selectedOrg.code
        }));
      }
    }
  };
  
  // Handle permissions change
  const handlePermissionsChange = (permissions: ModulePermission[]) => {
    setUserPermissions(permissions);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Name is required');
      setIsSaving(false);
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      setIsSaving(false);
      return;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      setIsSaving(false);
      return;
    }
    
    // Check password
    if (!formData.password) {
      setError('Password is required');
      setIsSaving(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSaving(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSaving(false);
      return;
    }
    
    // Check organization and organization code
    if (!formData.organizationId) {
      setError('Organization is required');
      setIsSaving(false);
      return;
    }
    
    if (!formData.organizationCode) {
      setError('Organization Code is required');
      setIsSaving(false);
      return;
    }
    
    // Ensure organization code matches the organization
    const selectedOrg = organizations.find(org => org.id.toString() === formData.organizationId);
    if (selectedOrg && selectedOrg.code !== formData.organizationCode) {
      setError('Organization Code does not match the selected organization');
      setIsSaving(false);
      return;
    }
    
    // If current user has organization, ensure the new user has the same organization
    if (currentUser?.organizationId && parseInt(formData.organizationId) !== currentUser.organizationId) {
      setError('New users must be created in your organization');
      setIsSaving(false);
      return;
    }
    
    // If current user has organization code, ensure the new user has the same code
    if (currentUser?.organizationCode && formData.organizationCode !== currentUser.organizationCode) {
      setError('Organization code must match your organization');
      setIsSaving(false);
      return;
    }
    
    try {
      // Check if email already exists
      const existingUsers = await localUserService.getAll();
      const emailExists = existingUsers.some(u => 
        u.email.toLowerCase() === formData.email.toLowerCase() && 
        u.organizationCode === formData.organizationCode
      );
      
      if (emailExists) {
        setError('A user with this email already exists in this organization');
        return;
      }
      
      // Prepare user data
      const newUser: Partial<LocalUser> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password, // In a real app, this would be hashed
        role: formData.role,
        organizationId: formData.organizationId ? parseInt(formData.organizationId) : undefined,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
        organizationCode: formData.organizationCode.trim(),
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create user
      const createdUser = await localUserService.create(newUser);
      
      // If it's a Basic user, save permissions
      if (formData.role === UserRole.BASIC && userPermissions.length > 0) {
        // Save each permission
        for (const permission of userPermissions) {
          await permissionService.create({
            userId: createdUser.id,
            moduleId: permission.moduleId,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete,
            canApprove: permission.canApprove
          });
        }
      } else {
        // For non-Basic users, set default permissions based on role
        await permissionService.setDefaultPermissions(createdUser.id, formData.role);
      }
      
      setSuccess('User created successfully');
      
      // Redirect to user details page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/users/${createdUser.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Navigate back to users list
  const handleBack = () => {
    router.push('/dashboard/users');
  };
  
  // Add a function to generate an organization code
  const generateOrgCode = async () => {
    try {
      setIsSaving(true);
      const code = await localOrganizationService.generateUniqueCode();
      setFormData(prev => ({
        ...prev,
        organizationCode: code
      }));
    } catch (error) {
      console.error('Error generating organization code:', error);
      setError('Failed to generate organization code');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Create User">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout pageTitle="Create User">
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
            Create New User
          </h2>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="message-box message-box-error">
            <div className="message-box-icon">
              <AlertCircle />
            </div>
            <div className="message-box-content">
              <h3 className="message-box-title">Error</h3>
              <p className="message-box-message">{error}</p>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="message-box message-box-success">
            <div className="message-box-icon">✓</div>
            <div className="message-box-content">
              <h3 className="message-box-title">Success</h3>
              <p className="message-box-message">{success}</p>
            </div>
          </div>
        )}
        
        {/* User Create Form */}
        <div className="user-form-card">
          <form onSubmit={handleSubmit}>
            <div className="user-form-section">
              <h3 className="user-form-section-title">User Information</h3>
              <p className="user-form-section-description">
                Enter the new user's profile information.
              </p>
            </div>
            
            <div className="user-form-section">
              {/* Basic Information */}
              <div className="user-form-grid">
                <div className="form-field">
                  <label htmlFor="name" className="form-field-label">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-field-input"
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="email" className="form-field-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-field-input"
                    required
                  />
                </div>
              </div>
              
              {/* Password */}
              <div className="user-form-section">
                <h3 className="user-form-section-title">Security Details</h3>
                <p className="user-form-section-description">
                  Password will be automatically generated. You'll need to share this password with the user.
                </p>

                <div className="user-form-grid">
                  <div className="form-field">
                    <label htmlFor="password" className="form-field-label">
                      Password
                    </label>
                    <div className="relative flex">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-field-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-field">
                    <div className="flex items-center justify-between">
                      <label className="form-field-label">Password Actions</label>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="form-button form-button-secondary"
                      >
                        <RefreshCw className="form-button-icon" />
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={copyPasswordToClipboard}
                        className="form-button form-button-secondary"
                        disabled={!formData.password}
                      >
                        {isCopied ? (
                          <>
                            <Check className="form-button-icon" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="form-button-icon" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    {isPasswordGenerated && (
                      <p className="text-sm text-gray-500 mt-2">
                        Be sure to provide this password to the user. They can reset it later.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="user-form-grid">
                <div className="form-field">
                  <label htmlFor="role" className="form-field-label">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-field-select"
                  >
                    <option value={UserRole.BASIC}>Basic User</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    {currentUser?.role === UserRole.ADMIN && (
                      <option value={UserRole.ADMIN}>Admin</option>
                    )}
                  </select>
                </div>
                
                <div className="form-field">
                  <div className="flex items-center mt-6">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="form-field-checkbox"
                    />
                    <label htmlFor="isActive" className="form-field-label mb-0 ml-2">
                      Active Account
                    </label>
                  </div>
                  <p className="form-field-hint">User can log in and access the system.</p>
                </div>
              </div>
              
              {/* Organization Information */}
              <div className="user-form-grid">
                <div className="form-field">
                  <label htmlFor="organizationId" className="form-field-label">
                    Organization
                  </label>
                  {currentUser?.organizationId ? (
                    // If user has an organization, show it as read-only
                    <div className="flex">
                      <input
                        type="text"
                        value={organizations.find(org => org.id.toString() === formData.organizationId)?.name || 'Unknown Organization'}
                        className="form-field-input bg-gray-100"
                        readOnly
                      />
                    </div>
                  ) : (
                    // Otherwise, allow selection from dropdown (for admins without org)
                    <select
                      id="organizationId"
                      name="organizationId"
                      value={formData.organizationId}
                      onChange={handleChange}
                      className="form-field-select"
                    >
                      <option value="">Select Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  )}
                  {currentUser?.organizationId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Users are automatically assigned to your organization
                    </p>
                  )}
                </div>
                
                <div className="form-field">
                  <label htmlFor="organizationCode" className="form-field-label">
                    Organization Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="organizationCode"
                      name="organizationCode"
                      value={formData.organizationCode}
                      onChange={handleChange}
                      className={`form-field-input ${currentUser?.organizationId ? 'bg-gray-100' : ''}`}
                      readOnly={Boolean(currentUser?.organizationId)}
                    />
                    {!currentUser?.organizationId && (
                      <button
                        type="button"
                        onClick={generateOrgCode}
                        className="form-button form-button-secondary ml-2"
                      >
                        <RefreshCw className="form-button-icon" />
                        Generate
                      </button>
                    )}
                  </div>
                  {!currentUser?.organizationId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Generate or enter an organization code for this user
                    </p>
                  )}
                </div>
              </div>
              
              <div className="user-form-grid">
                <div className="form-field">
                  <label htmlFor="departmentId" className="form-field-label">
                    Department (Optional)
                  </label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="form-field-select"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                {formData.role !== UserRole.ADMIN && (
                  <div className="form-field">
                    <label htmlFor="managerId" className="form-field-label">
                      Manager (Optional)
                    </label>
                    <select
                      id="managerId"
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleChange}
                      className="form-field-select"
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>{manager.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* Module Permissions (only for Basic Users) */}
            {formData.role === UserRole.BASIC && (
              <div className="user-form-section">
                <h3 className="user-form-section-title">Module Permissions</h3>
                <p className="user-form-section-description">
                  Select which modules this user can access and what actions they can perform.
                </p>
                <PermissionsManager 
                  userId={0}
                  userRole={formData.role}
                  onChange={handlePermissionsChange}
                />
              </div>
            )}
            
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
                {isSaving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 