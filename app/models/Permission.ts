// Define module IDs as constants for consistent usage
export enum ModuleId {
  DASHBOARD = 'dashboard',
  USER_MANAGEMENT = 'users',
  INVENTORY = 'inventory',
  WORK_ORDERS = 'workOrders',
  PURCHASE = 'purchase',
  SALES = 'sales'
}

// Define Permission interface
export interface IPermission {
  _id?: string;
  userId: number;
  moduleId: ModuleId;
  canView: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define a type for module permission settings
export type ModulePermission = {
  moduleId: ModuleId;
  moduleName: string;
  canView: boolean;
};

// Default permissions by role
export const getDefaultPermissions = (role: string): ModulePermission[] => {
  const modules = [
    { moduleId: ModuleId.DASHBOARD, moduleName: 'Dashboard' },
    { moduleId: ModuleId.USER_MANAGEMENT, moduleName: 'User Management' },
    { moduleId: ModuleId.INVENTORY, moduleName: 'Inventory' },
    { moduleId: ModuleId.WORK_ORDERS, moduleName: 'Work Orders' },
    { moduleId: ModuleId.PURCHASE, moduleName: 'Purchase Management' },
    { moduleId: ModuleId.SALES, moduleName: 'Sales' }
  ];

  switch (role) {
    case 'ADMIN':
      // Admin has full access to everything
      return modules.map(module => ({
        ...module,
        canView: true
      }));
    
    case 'MANAGER':
      // Manager has full access to most modules, but limited access to user management
      return modules.map(module => ({
        ...module,
        canView: true
      }));
    
    case 'BASIC':
      // Basic users have limited access
      return modules.map(module => {
        if (module.moduleId === ModuleId.USER_MANAGEMENT) {
          return {
            ...module,
            canView: false // Can't access user management
          };
        }
        if (module.moduleId === ModuleId.DASHBOARD) {
          return {
            ...module,
            canView: true // Can access dashboard
          };
        }
        return {
          ...module,
          canView: false // By default, can't access other modules until granted
        };
      });
    
    default:
      // Default minimal permissions
      return modules.map(module => ({
        ...module,
        canView: module.moduleId === ModuleId.DASHBOARD // Only dashboard is viewable
      }));
  }
}; 