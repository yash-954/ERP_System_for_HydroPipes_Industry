'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { LocalUser } from '@/app/lib/db/localDb';
import { UserRole } from '@/app/models/User';
import localUserService from '@/app/lib/services/localUserService';
import localOrganizationService from '@/app/lib/services/localOrganizationService';
import UserConfirmationDialog from '@/app/components/users/UserConfirmationDialog';
import UserItem from '@/app/components/users/UserItem';
import '@/app/styles/users.css';
import '@/app/styles/user-item.css';

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Users data state
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LocalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add state for confirmation dialogs
  const [statusConfirmation, setStatusConfirmation] = useState<{
    isOpen: boolean;
    user: LocalUser | null;
    isProcessing: boolean;
  }>({
    isOpen: false,
    user: null,
    isProcessing: false
  });
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
    isProcessing: boolean;
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    isProcessing: false
  });

  // Load organization data
  useEffect(() => {
    const loadOrganizationName = async () => {
      if (currentUser?.organizationId) {
        try {
          const organization = await localOrganizationService.getById(currentUser.organizationId);
          if (organization) {
            setOrganizationName(organization.name);
          }
        } catch (err) {
          console.error("Failed to load organization data:", err);
        }
      }
    };

    if (currentUser) {
      loadOrganizationName();
    }
  }, [currentUser]);

  // Load users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        let fetchedUsers: LocalUser[] = [];
        
        // If the current user doesn't have an organization ID, they cannot view any users
        if (!currentUser?.organizationId) {
          setError('Your account is not associated with an organization');
          setIsLoading(false);
          return;
        }
        
        // Always filter by the current user's organization
        fetchedUsers = await localUserService.getAllByOrganization(currentUser.organizationId);
        
        // Further filtering based on role
        if (currentUser.role === UserRole.MANAGER) {
          // Managers can only see basic users that they manage and themselves
          fetchedUsers = fetchedUsers.filter(user => 
            (user.role === UserRole.BASIC && user.managerId === currentUser.id) || 
            user.id === currentUser.id
          );
        }
        
        // Ensure all users have matching organization code
        const orgCode = currentUser.organizationCode;
        if (orgCode) {
          fetchedUsers = fetchedUsers.filter(user => user.organizationCode === orgCode);
        }
        
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
        setTotalPages(Math.ceil(fetchedUsers.length / ITEMS_PER_PAGE));
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // Apply filters and search
  useEffect(() => {
    let result = [...users];
    
    // Apply search
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(lowercaseSearch) || 
          user.email.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'ALL') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      const isActive = statusFilter === 'ACTIVE';
      result = result.filter(user => user.isActive === isActive);
    }
    
    setFilteredUsers(result);
    setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE));
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  // Updated handle delete user function
  const handleDeleteUser = async (userId: number, userName: string) => {
    // Open confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      userId,
      userName,
      isProcessing: false
    });
  };
  
  // Confirm deletion
  const confirmDeleteUser = async () => {
    if (!deleteConfirmation.userId) return;
    
    try {
      setDeleteConfirmation(prev => ({ ...prev, isProcessing: true }));
      
      await localUserService.delete(deleteConfirmation.userId);
      
      // Update users list
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== deleteConfirmation.userId)
      );
      
      // Show success message
      alert('User deleted successfully');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      
      alert('Failed to delete user');
    } finally {
      // Close confirmation dialog
      setDeleteConfirmation({
        isOpen: false,
        userId: null,
        userName: '',
        isProcessing: false
      });
    }
  };
  
  // Cancel deletion
  const cancelDeleteUser = () => {
    setDeleteConfirmation({
      isOpen: false,
      userId: null,
      userName: '',
      isProcessing: false
    });
  };
  
  // Updated handle toggle status function
  const handleToggleStatus = async (user: LocalUser) => {
    // Open confirmation dialog
    setStatusConfirmation({
      isOpen: true,
      user,
      isProcessing: false
    });
  };
  
  // Confirm status change
  const confirmToggleStatus = async () => {
    if (!statusConfirmation.user) return;
    
    const user = statusConfirmation.user;
    
    try {
      setStatusConfirmation(prev => ({ ...prev, isProcessing: true }));
      
      // Toggle status
      const updatedUser = {
        ...user,
        isActive: !user.isActive
      };
      
      // Ensure user.id is a number before calling update
      if (typeof user.id === 'number') {
        await localUserService.update(user.id, updatedUser);
        
        // Update users list
        setUsers(prevUsers =>
          prevUsers.map(u => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
        );
        
        // Show success message
        alert('User status updated successfully');
      } else {
        throw new Error('User ID is not a valid number');
      }
      
    } catch (error) {
      console.error('Error updating user status:', error);
      
      alert('Failed to update user status');
    } finally {
      // Close confirmation dialog
      setStatusConfirmation({
        isOpen: false,
        user: null,
        isProcessing: false
      });
    }
  };
  
  // Cancel status change
  const cancelToggleStatus = () => {
    setStatusConfirmation({
      isOpen: false,
      user: null,
      isProcessing: false
    });
  };

  // Navigate to user details page
  const navigateToUserDetails = (userId: number) => {
    router.push(`/dashboard/users/${userId}`);
  };

  // Navigate to edit user page
  const navigateToEditUser = (userId: number) => {
    router.push(`/dashboard/users/${userId}/edit`);
  };

  // Navigate to create user page
  const navigateToCreateUser = () => {
    router.push('/dashboard/users/create');
  };

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Format role for display
  const formatRole = (role: UserRole) => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  // Handle toggle status for UserItem component
  const handleUserToggleStatus = (userId: string, newStatus: boolean) => {
    const user = users.find(u => u.id === parseInt(userId, 10));
    if (user) {
      handleToggleStatus(user);
    }
  };

  // Handle delete for UserItem component
  const handleUserDelete = (userId: string) => {
    const user = users.find(u => u.id === parseInt(userId, 10));
    if (user) {
      handleDeleteUser(parseInt(userId, 10), user.name);
    }
  };

  return (
    <DashboardLayout pageTitle="User Management">
      <div className="users-page">
        <div className="page-header">
          <div className="header-content">
            <h2 className="header-title">
              <Users className="header-title-icon" />
              Users
              <span className="user-count-badge">
                {filteredUsers.length} users
              </span>
            </h2>
            {organizationName && (
              <div className="flex items-center text-gray-600 mt-1">
                <Building className="h-4 w-4 mr-1" />
                <span className="text-sm">{organizationName} Organization</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={navigateToCreateUser}
            className="add-user-button"
          >
            <UserPlus className="add-user-button-icon" />
            Add User
          </button>
        </div>
        
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="alert-icon" />
            <div className="alert-content">
              <h3 className="alert-title">Error</h3>
              <p className="alert-message">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="alert-close"
            >
              <XCircle />
            </button>
          </div>
        )}
        
        <div className="filters-section">
          <div className="filters-container">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="search-input"
              />
            </div>
            
            <div>
              <span className="filter-label">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Roles</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.MANAGER}>Manager</option>
                <option value={UserRole.BASIC}>Basic</option>
              </select>
            </div>
            
            <div>
              <span className="filter-label">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            
            <button
              onClick={handleResetFilters}
              className="reset-filters-button"
            >
              <Filter className="reset-filters-icon" />
              Reset Filters
            </button>
          </div>
        </div>
        
        <div className="users-container">
          <div className="overflow-x-auto">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Organization Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      Loading users...
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No users found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map(user => (
                    <UserItem
                      key={user.id}
                      user={{
                        id: user.id?.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        active: user.isActive,
                        organizationCode: user.organizationCode
                      }}
                      currentUserId={currentUser?.id?.toString() || ''}
                      onToggleStatus={handleUserToggleStatus}
                      onDelete={handleUserDelete}
                      isLoading={isLoading}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
                </span> of <span className="font-medium">{filteredUsers.length}</span> results
              </div>
              <div className="pagination-controls">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status change confirmation dialog */}
      <UserConfirmationDialog
        isOpen={statusConfirmation.isOpen}
        title={statusConfirmation.user?.isActive ? 'Deactivate User' : 'Activate User'}
        message={
          statusConfirmation.user?.isActive
            ? `Are you sure you want to deactivate ${statusConfirmation.user?.name}? They will not be able to log in until the account is reactivated.`
            : `Are you sure you want to activate ${statusConfirmation.user?.name}? They will be able to log in to the system.`
        }
        confirmLabel={statusConfirmation.user?.isActive ? 'Deactivate' : 'Activate'}
        type={statusConfirmation.user?.isActive ? 'warning' : 'success'}
        onConfirm={confirmToggleStatus}
        onCancel={cancelToggleStatus}
        isProcessing={statusConfirmation.isProcessing}
      />
      
      {/* Delete confirmation dialog */}
      <UserConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirmation.userName}? This action cannot be undone.`}
        confirmLabel={deleteConfirmation.isProcessing ? "Deleting..." : "Delete"}
        type="danger"
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
        isProcessing={deleteConfirmation.isProcessing}
      />
    </DashboardLayout>
  );
} 