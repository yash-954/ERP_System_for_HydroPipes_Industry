'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Calendar, 
  Building, 
  Users, 
  Shield, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { UserRole } from '@/app/models/User';
import { LocalUser } from '@/app/lib/db/localDb';
import localUserService from '@/app/lib/services/localUserService';
import localOrganizationService from '@/app/lib/services/localOrganizationService';
import departmentService from '@/app/lib/services/departmentService';
import { formatDate } from '@/app/lib/utils/dateUtils';
import PermissionsManager from '@/app/components/users/PermissionsManager';
import UserConfirmationDialog from '@/app/components/users/UserConfirmationDialog';
import ErrorAlert from '@/app/components/common/ErrorAlert';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { generateSecurePassword } from '@/app/lib/utils/passwordUtils';
import '@/app/styles/user-details.css';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = parseInt(params.id);
  
  // States
  const [user, setUser] = useState<LocalUser | null>(null);
  const [organization, setOrganization] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [manager, setManager] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Password management states
  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [confirmPasswordChange, setConfirmPasswordChange] = useState(false);
  
  // Fetch user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Check if the current user has permission to view this user
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
          setError('User not found');
          return;
        }
        
        setUser(userData);
        
        // Load organization
        if (userData.organizationId) {
          const org = await localOrganizationService.getById(userData.organizationId);
          setOrganization(org?.name || 'Unknown');
        }
        
        // Load department
        if (userData.departmentId) {
          const dept = await departmentService.departmentService.getById(userData.departmentId);
          setDepartment(dept?.name || 'Unknown');
        }
        
        // Load manager
        if (userData.managerId) {
          const mgr = await localUserService.getById(userData.managerId);
          setManager(mgr?.name || 'Unknown');
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user information');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      loadUserData();
    }
  }, [userId, router, currentUser]);
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Copy password to clipboard
  const copyPasswordToClipboard = () => {
    if (user?.password) {
      navigator.clipboard.writeText(user.password);
      setIsCopied(true);
      
      // Reset copy indicator after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  // Open confirmation dialog for password regeneration
  const handleRegeneratePassword = () => {
    setConfirmPasswordChange(true);
  };
  
  // Cancel password regeneration
  const cancelPasswordRegeneration = () => {
    setConfirmPasswordChange(false);
  };
  
  // Regenerate and save a new password
  const confirmRegeneratePassword = async () => {
    try {
      setIsGeneratingPassword(true);
      
      // Generate a new secure password
      const newPassword = generateSecurePassword(10);
      
      // Update the user's password
      await localUserService.update(userId, { password: newPassword });
      
      // Refresh user data
      const updatedUser = await localUserService.getById(userId);
      setUser(updatedUser || null);
      
      // Close the confirmation dialog
      setConfirmPasswordChange(false);
    } catch (error) {
      console.error('Error regenerating password:', error);
      setError('Failed to regenerate password');
    } finally {
      setIsGeneratingPassword(false);
    }
  };
  
  // Handle user deletion
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    try {
      setIsDeleting(true);
      
      await localUserService.delete(userId);
      
      // Redirect to users list
      router.push('/dashboard/users');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Cancel delete confirmation
  const cancelDelete = () => {
    setConfirmDelete(false);
  };
  
  // Navigate to edit page
  const handleEdit = () => {
    router.push(`/dashboard/users/${userId}/edit`);
  };
  
  // Navigate back to users list
  const handleBack = () => {
    router.push('/dashboard/users');
  };
  
  if (isLoading) {
    return (
      <DashboardLayout pageTitle="User Details">
        <div className="flex justify-center items-center h-96">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !user) {
    return (
      <DashboardLayout pageTitle="User Details">
        <ErrorAlert message={error || 'User not found'} />
      </DashboardLayout>
    );
  }
  
  const canEdit = currentUser?.role === UserRole.ADMIN || 
                 (currentUser?.role === UserRole.MANAGER && user.managerId === currentUser.id) || 
                 currentUser?.id === user.id;
  
  const canDelete = currentUser?.role === UserRole.ADMIN ||
                   (currentUser?.role === UserRole.MANAGER && user.managerId === currentUser.id);
  
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.BASIC:
        return 'Basic User';
      default:
        return role;
    }
  };
  
  return (
    <DashboardLayout pageTitle="User Details">
      <div className="user-details-container">
        <div className="mb-4">
          <button onClick={handleBack} className="back-link">
            <ArrowLeft className="back-icon" />
            Back to Users
          </button>
        </div>
        
        <div className="user-details-title">
          <User className="user-details-icon" />
          <h1>User Details: {user.name}</h1>
        </div>

        {/* Delete Confirmation */}
        <UserConfirmationDialog
          isOpen={confirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete ${user?.name}? This action cannot be undone and all user data will be permanently removed.`}
          confirmLabel={isDeleting ? "Deleting..." : "Delete"}
          type="danger"
          onConfirm={handleDelete}
          onCancel={cancelDelete}
          isProcessing={isDeleting}
        />
        
        {/* Password Change Confirmation */}
        <UserConfirmationDialog
          isOpen={confirmPasswordChange}
          title="Regenerate Password"
          message={`Are you sure you want to regenerate the password for ${user?.name}? The current password will be permanently lost.`}
          confirmLabel={isGeneratingPassword ? "Regenerating..." : "Regenerate"}
          type="warning"
          onConfirm={confirmRegeneratePassword}
          onCancel={cancelPasswordRegeneration}
          isProcessing={isGeneratingPassword}
        />
        
        {/* Main Content Card */}
        <div className="user-details-card">
          {/* User Profile Section */}
          <div className="user-profile">
            <h2 className="user-name">{user.name}</h2>
            <div className="user-email">
              <Mail className="user-email-icon" />
              <span>{user.email}</span>
            </div>
            <div className="action-buttons">
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="edit-button"
                >
                  <Edit className="button-icon" />
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="delete-button"
                >
                  <Trash2 className="button-icon" />
                  Delete
                </button>
              )}
            </div>
          </div>
          
          {/* Security Information */}
          <div className="info-section">
            <h3 className="section-title">Security Information</h3>
            <div>
              <h4 className="subsection-title">Login Credentials</h4>
              <div className="credential-item">
                <span className="credential-label">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Organization Code:</span>
                <span>{user.organizationCode}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Password:</span>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={user.password}
                    readOnly
                    className="password-field"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-action"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyPasswordToClipboard}
                    className="password-action"
                  >
                    {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="password-action"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="help-text">
                Use these credentials to share with {user.name} for login access.
              </p>
            </div>
          </div>
          
          {/* Personal Information */}
          <div className="info-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="info-grid">
              <div>
                <div className="info-item">
                  <h4 className="info-item-label">Role</h4>
                  <div className="info-item-value">
                    <Shield className="info-icon" />
                    <span>{getRoleLabel(user.role)}</span>
                  </div>
                </div>
                
                <div className="info-item">
                  <h4 className="info-item-label">Status</h4>
                  <div className="info-item-value">
                    {user.isActive ? (
                      <>
                        <CheckCircle className="info-icon active-status" />
                        <span className="active-status">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="info-icon inactive-status" />
                        <span className="inactive-status">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
                
                {organization && (
                  <div className="info-item">
                    <h4 className="info-item-label">Organization</h4>
                    <div className="info-item-value">
                      <Building className="info-icon" />
                      <span>{organization}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                {department && (
                  <div className="info-item">
                    <h4 className="info-item-label">Department</h4>
                    <div className="info-item-value">
                      <Users className="info-icon" />
                      <span>{department}</span>
                    </div>
                  </div>
                )}
                
                {manager && (
                  <div className="info-item">
                    <h4 className="info-item-label">Reports To</h4>
                    <div className="info-item-value">
                      <User className="info-icon" />
                      <span>{manager}</span>
                    </div>
                  </div>
                )}
                
                <div className="info-item">
                  <h4 className="info-item-label">Created On</h4>
                  <div className="info-item-value">
                    <Calendar className="info-icon" />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Access Permissions */}
        <div className="user-details-card">
          <div className="info-section">
            <h3 className="section-title">Access Permissions</h3>
            <p className="help-text">
              Module-specific permissions for this user.
            </p>
          </div>
          
          <div className="info-section">
            {user.role === UserRole.MANAGER && (
              <p className="help-text mb-4">
                Manager users have access to manage their team and all modules.
              </p>
            )}
            <PermissionsManager 
              userId={userId} 
              userRole={user.role} 
              readOnly={true} 
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 

