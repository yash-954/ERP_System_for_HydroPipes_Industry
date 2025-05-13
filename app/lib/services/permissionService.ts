import { db, LocalPermission } from '../db/localDb';
import { ModuleId, getDefaultPermissions, ModulePermission } from '../../models/Permission';
import { UserRole } from '../../models/User';

// Service for handling permission operations
export const permissionService = {
  // Get all permissions
  getAll: async (): Promise<LocalPermission[]> => {
    try {
      return await db.permissions.toArray();
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  // Get permissions by user ID
  getByUserId: async (userId: number): Promise<LocalPermission[]> => {
    try {
      return await db.permissions.where('userId').equals(userId).toArray();
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error);
      throw error;
    }
  },

  // Get permission by user ID and module ID
  getByUserAndModule: async (userId: number, moduleId: ModuleId): Promise<LocalPermission | undefined> => {
    try {
      const permissions = await db.permissions
        .where('userId').equals(userId)
        .and(item => item.moduleId === moduleId)
        .toArray();
      
      return permissions[0];
    } catch (error) {
      console.error(`Error fetching permission for user ${userId} and module ${moduleId}:`, error);
      throw error;
    }
  },

  // Create a new permission
  create: async (permissionData: Omit<LocalPermission, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
    try {
      // Check if permission already exists
      const existingPermission = await permissionService.getByUserAndModule(
        permissionData.userId, 
        permissionData.moduleId
      );
      
      if (existingPermission) {
        throw new Error('Permission already exists for this user and module');
      }

      // Create the permission
      const id = await db.permissions.add({
        ...permissionData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },

  // Update a permission
  update: async (id: number, permissionData: Partial<Omit<LocalPermission, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> => {
    try {
      // Update the permission
      await db.permissions.update(id, {
        ...permissionData,
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error(`Error updating permission with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a permission
  delete: async (id: number): Promise<void> => {
    try {
      await db.permissions.delete(id);
    } catch (error) {
      console.error(`Error deleting permission with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete all permissions for a user
  deleteByUserId: async (userId: number): Promise<void> => {
    try {
      await db.permissions.where('userId').equals(userId).delete();
    } catch (error) {
      console.error(`Error deleting permissions for user ${userId}:`, error);
      throw error;
    }
  },

  // Set default permissions for a user based on role
  setDefaultPermissions: async (userId: number, role: UserRole): Promise<void> => {
    try {
      // Delete existing permissions
      await permissionService.deleteByUserId(userId);

      // Get default permissions for role
      const defaultPermissions = getDefaultPermissions(role);

      // Create new permissions
      for (const permission of defaultPermissions) {
        await permissionService.create({
          userId,
          moduleId: permission.moduleId,
          canView: permission.canView
        });
      }
    } catch (error) {
      console.error(`Error setting default permissions for user ${userId}:`, error);
      throw error;
    }
  },

  // Get effective permissions for a user (as ModulePermission[] format)
  getEffectivePermissions: async (userId: number, role: UserRole): Promise<ModulePermission[]> => {
    try {
      // Get user's custom permissions
      const userPermissions = await permissionService.getByUserId(userId);
      
      // Get default permissions for the role
      const defaultPermissions = getDefaultPermissions(role);
      
      // If no custom permissions, return default permissions
      if (userPermissions.length === 0) {
        return defaultPermissions;
      }
      
      // Convert user permissions to ModulePermission format
      const effectivePermissions: ModulePermission[] = defaultPermissions.map(defaultPerm => {
        // Find custom permission for this module if it exists
        const customPerm = userPermissions.find(p => p.moduleId === defaultPerm.moduleId);
        
        // If no custom permission, use default
        if (!customPerm) {
          return defaultPerm;
        }
        
        // Otherwise, override with custom permission
        return {
          moduleId: defaultPerm.moduleId,
          moduleName: defaultPerm.moduleName,
          canView: customPerm.canView
        };
      });
      
      return effectivePermissions;
    } catch (error) {
      console.error(`Error getting effective permissions for user ${userId}:`, error);
      throw error;
    }
  },

  // Check if a user has access to a module
  hasModuleAccess: async (userId: number, role: UserRole, moduleId: ModuleId): Promise<boolean> => {
    try {
      // Get effective permissions
      const permissions = await permissionService.getEffectivePermissions(userId, role);
      
      // Find permission for this module
      const modulePerm = permissions.find(p => p.moduleId === moduleId);
      if (!modulePerm) {
        return false;
      }
      
      // Check if user can view this module
      return modulePerm.canView;
    } catch (error) {
      console.error(`Error checking module access for user ${userId}, module ${moduleId}:`, error);
      return false;
    }
  }
};

export default permissionService; 