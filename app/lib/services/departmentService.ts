import { db, LocalDepartment, LocalTeamMember } from '../db/localDb';
import { DEFAULT_DEPARTMENTS, TeamRole } from '../../models/Department';
import { localUserService } from './localUserService';

// Service for handling department operations
export const departmentService = {
  // Get all departments
  getAll: async (): Promise<LocalDepartment[]> => {
    try {
      return await db.departments.toArray();
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get department by ID
  getById: async (id: number): Promise<LocalDepartment | undefined> => {
    try {
      return await db.departments.get(id);
    } catch (error) {
      console.error(`Error fetching department with ID ${id}:`, error);
      throw error;
    }
  },

  // Get departments by organization ID
  getByOrganization: async (organizationId: number): Promise<LocalDepartment[]> => {
    try {
      return await db.departments
        .where('organizationId')
        .equals(organizationId)
        .toArray();
    } catch (error) {
      console.error(`Error fetching departments for organization ${organizationId}:`, error);
      throw error;
    }
  },

  // Get departments by manager ID
  getByManager: async (managerId: number): Promise<LocalDepartment[]> => {
    try {
      return await db.departments
        .where('managerId')
        .equals(managerId)
        .toArray();
    } catch (error) {
      console.error(`Error fetching departments for manager ${managerId}:`, error);
      throw error;
    }
  },

  // Create a new department
  create: async (departmentData: Omit<LocalDepartment, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
    try {
      // Create the department
      const id = await db.departments.add({
        ...departmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  // Update a department
  update: async (id: number, departmentData: Partial<Omit<LocalDepartment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> => {
    try {
      // Update the department
      await db.departments.update(id, {
        ...departmentData,
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error(`Error updating department with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a department
  delete: async (id: number): Promise<void> => {
    try {
      // First, delete all team members in this department
      await teamMemberService.deleteByDepartment(id);
      
      // Then delete the department
      await db.departments.delete(id);
    } catch (error) {
      console.error(`Error deleting department with ID ${id}:`, error);
      throw error;
    }
  },

  // Seed default departments for an organization
  seedDefaultDepartments: async (organizationId: number): Promise<void> => {
    try {
      // Check if organization already has departments
      const existingDepts = await departmentService.getByOrganization(organizationId);
      if (existingDepts.length > 0) {
        return; // Organization already has departments
      }

      // Create default departments
      for (const dept of DEFAULT_DEPARTMENTS) {
        await departmentService.create({
          name: dept.name,
          description: dept.description,
          organizationId,
          managerId: 0, // Will be updated later when assigning managers
          isActive: true
        });
      }
    } catch (error) {
      console.error(`Error seeding default departments for organization ${organizationId}:`, error);
      throw error;
    }
  }
};

// Service for handling team member operations
export const teamMemberService = {
  // Get all team members
  getAll: async (): Promise<LocalTeamMember[]> => {
    try {
      return await db.teamMembers.toArray();
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  // Get team member by ID
  getById: async (id: number): Promise<LocalTeamMember | undefined> => {
    try {
      return await db.teamMembers.get(id);
    } catch (error) {
      console.error(`Error fetching team member with ID ${id}:`, error);
      throw error;
    }
  },

  // Get team members by department ID
  getByDepartment: async (departmentId: number): Promise<LocalTeamMember[]> => {
    try {
      return await db.teamMembers
        .where('departmentId')
        .equals(departmentId)
        .toArray();
    } catch (error) {
      console.error(`Error fetching team members for department ${departmentId}:`, error);
      throw error;
    }
  },

  // Get team members by user ID (find all departments a user belongs to)
  getByUser: async (userId: number): Promise<LocalTeamMember[]> => {
    try {
      return await db.teamMembers
        .where('userId')
        .equals(userId)
        .toArray();
    } catch (error) {
      console.error(`Error fetching team memberships for user ${userId}:`, error);
      throw error;
    }
  },

  // Check if user is in department
  isUserInDepartment: async (userId: number, departmentId: number): Promise<boolean> => {
    try {
      const teamMembers = await db.teamMembers
        .where('departmentId').equals(departmentId)
        .and(item => item.userId === userId)
        .count();
      
      return teamMembers > 0;
    } catch (error) {
      console.error(`Error checking if user ${userId} is in department ${departmentId}:`, error);
      return false;
    }
  },

  // Add user to department
  addUserToDepartment: async (userId: number, departmentId: number, role: TeamRole = TeamRole.MEMBER): Promise<number> => {
    try {
      // Check if user already in department
      const isAlreadyMember = await teamMemberService.isUserInDepartment(userId, departmentId);
      if (isAlreadyMember) {
        throw new Error(`User ${userId} is already a member of department ${departmentId}`);
      }

      // Check if department exists
      const department = await departmentService.getById(departmentId);
      if (!department) {
        throw new Error(`Department ${departmentId} not found`);
      }

      // Check if user exists
      const user = await localUserService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Add user to department
      const id = await db.teamMembers.add({
        departmentId,
        userId,
        role,
        joinedAt: new Date()
      });

      // If role is MANAGER, update department managerId
      if (role === TeamRole.MANAGER) {
        await departmentService.update(departmentId, { managerId: userId });
      }

      return id;
    } catch (error) {
      console.error(`Error adding user ${userId} to department ${departmentId}:`, error);
      throw error;
    }
  },

  // Remove user from department
  removeUserFromDepartment: async (userId: number, departmentId: number): Promise<void> => {
    try {
      // Get team member record
      const teamMembers = await db.teamMembers
        .where('departmentId').equals(departmentId)
        .and(item => item.userId === userId)
        .toArray();
      
      if (teamMembers.length === 0) {
        throw new Error(`User ${userId} is not a member of department ${departmentId}`);
      }

      // Check if user is department manager
      const department = await departmentService.getById(departmentId);
      if (department && department.managerId === userId) {
        // Unset the department manager
        await departmentService.update(departmentId, { managerId: 0 });
      }

      // Remove team member
      await db.teamMembers.delete(teamMembers[0].id!);
    } catch (error) {
      console.error(`Error removing user ${userId} from department ${departmentId}:`, error);
      throw error;
    }
  },

  // Update team member role
  updateRole: async (userId: number, departmentId: number, newRole: TeamRole): Promise<void> => {
    try {
      // Get team member record
      const teamMembers = await db.teamMembers
        .where('departmentId').equals(departmentId)
        .and(item => item.userId === userId)
        .toArray();
      
      if (teamMembers.length === 0) {
        throw new Error(`User ${userId} is not a member of department ${departmentId}`);
      }

      const teamMember = teamMembers[0];
      
      // Update role
      await db.teamMembers.update(teamMember.id!, { role: newRole });

      // If new role is MANAGER, update department managerId
      if (newRole === TeamRole.MANAGER) {
        await departmentService.update(departmentId, { managerId: userId });
      } 
      // If old role was MANAGER and new role is not, unset department managerId
      else if (teamMember.role === TeamRole.MANAGER) {
        const department = await departmentService.getById(departmentId);
        if (department && department.managerId === userId) {
          await departmentService.update(departmentId, { managerId: 0 });
        }
      }
    } catch (error) {
      console.error(`Error updating role for user ${userId} in department ${departmentId}:`, error);
      throw error;
    }
  },

  // Delete all team members in a department
  deleteByDepartment: async (departmentId: number): Promise<void> => {
    try {
      await db.teamMembers.where('departmentId').equals(departmentId).delete();
    } catch (error) {
      console.error(`Error deleting team members for department ${departmentId}:`, error);
      throw error;
    }
  },

  // Delete all team memberships for a user
  deleteByUser: async (userId: number): Promise<void> => {
    try {
      // Check if user is a manager of any departments
      const departments = await departmentService.getByManager(userId);
      
      // Update departments where user is manager
      for (const dept of departments) {
        await departmentService.update(dept.id!, { managerId: 0 });
      }
      
      // Delete team memberships
      await db.teamMembers.where('userId').equals(userId).delete();
    } catch (error) {
      console.error(`Error deleting team memberships for user ${userId}:`, error);
      throw error;
    }
  },

  // Get all users in a manager's departments
  getTeamMembersByManager: async (managerId: number): Promise<{ user: any, department: LocalDepartment }[]> => {
    try {
      // Get departments managed by this user
      const departments = await departmentService.getByManager(managerId);
      
      if (departments.length === 0) {
        return [];
      }
      
      const result: { user: any, department: LocalDepartment }[] = [];
      
      // For each department, get all team members
      for (const dept of departments) {
        const teamMembers = await teamMemberService.getByDepartment(dept.id!);
        
        // Get user details for each team member
        for (const member of teamMembers) {
          // Skip the manager themselves
          if (member.userId === managerId) continue;
          
          const user = await localUserService.getUserById(member.userId);
          if (user) {
            result.push({
              user,
              department: dept
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting team members for manager ${managerId}:`, error);
      throw error;
    }
  }
};

export default {
  departmentService,
  teamMemberService
}; 