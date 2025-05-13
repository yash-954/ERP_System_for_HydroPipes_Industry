'use client';

import React, { useState, useEffect } from 'react';
import { ModuleId, ModulePermission, getDefaultPermissions } from '@/app/models/Permission';
import { UserRole } from '@/app/models/User';
import permissionService from '@/app/lib/services/permissionService';

interface PermissionsManagerProps {
  userId: number;
  userRole: UserRole;
  onChange?: (permissions: ModulePermission[]) => void;
  readOnly?: boolean;
}

export default function PermissionsManager({
  userId,
  userRole,
  onChange,
  readOnly = false
}: PermissionsManagerProps) {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the user's permissions
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let userPermissions: ModulePermission[];
        
        if (userId > 0) {
          // Existing user - get their permissions
          userPermissions = await permissionService.getEffectivePermissions(userId, userRole);
        } else {
          // New user - use default permissions for role
          userPermissions = getDefaultPermissions(userRole);
        }
        
        setPermissions(userPermissions);
        
        // Call onChange with initial permissions
        if (onChange) {
          onChange(userPermissions);
        }
      } catch (err) {
        console.error('Error loading permissions:', err);
        setError('Failed to load user permissions');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPermissions();
  }, [userId, userRole]);

  // Handle permission change
  const handlePermissionChange = (moduleId: ModuleId, checked: boolean) => {
    if (readOnly) return;
    
    // Find and update the specific permission
    const updatedPermissions = permissions.map(permission => {
      if (permission.moduleId === moduleId) {
        return { ...permission, canView: checked };
      }
      return permission;
    });
    
    setPermissions(updatedPermissions);
    
    // Call onChange with updated permissions
    if (onChange) {
      onChange(updatedPermissions);
    }
  };

  // Get only the main operational modules
  const getMainModules = () => {
    return permissions.filter(p => 
      p.moduleId === ModuleId.INVENTORY || 
      p.moduleId === ModuleId.WORK_ORDERS || 
      p.moduleId === ModuleId.PURCHASE || 
      p.moduleId === ModuleId.SALES
    );
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading permissions...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Admin and Manager users have fixed permissions based on their role
  if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-sm text-gray-600">
          {userRole === UserRole.ADMIN 
            ? 'Admin users have full access to all system features.'
            : 'Manager users have access to manage their team and all modules.'}
        </p>
      </div>
    );
  }

  const mainModules = getMainModules();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Module Access</h3>
      
      <div className="bg-yellow-50 p-3 rounded-md mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Select which modules this user can access. Basic users cannot access User Management regardless of settings.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mainModules.length > 0 ? (
          mainModules.map(permission => (
            <div key={permission.moduleId} className="flex items-center p-4 border border-gray-200 rounded-md">
              <input
                type="checkbox"
                id={`${permission.moduleId}-view`}
                checked={permission.canView}
                onChange={(e) => handlePermissionChange(permission.moduleId, e.target.checked)}
                disabled={readOnly}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label 
                htmlFor={`${permission.moduleId}-view`} 
                className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer select-none"
              >
                {permission.moduleName}
              </label>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-gray-500">
            No modules available for this user role.
          </div>
        )}
      </div>
    </div>
  );
} 