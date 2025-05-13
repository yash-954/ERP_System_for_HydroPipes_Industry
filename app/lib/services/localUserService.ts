import { db, LocalUser } from '../db/localDb';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../models/User';
import localOrganizationService from './localOrganizationService';

// Service for handling user operations
export const localUserService = {
  // Get all users
  getAll: async (): Promise<LocalUser[]> => {
    try {
      return await db.users.toArray();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get all users by organization ID
  getAllByOrganization: async (organizationId: number): Promise<LocalUser[]> => {
    try {
      return await db.users.where('organizationId').equals(organizationId).toArray();
    } catch (error) {
      console.error(`Error fetching users for organization ${organizationId}:`, error);
      throw error;
    }
  },

  // Get user by ID
  getById: async (id: number): Promise<LocalUser | undefined> => {
    try {
      return await db.users.get(id);
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  // Get user by email
  getByEmail: async (email: string): Promise<LocalUser | undefined> => {
    try {
      return await db.users.where('email').equals(email).first();
    } catch (error) {
      console.error(`Error fetching user with email ${email}:`, error);
      throw error;
    }
  },

  // Get user by email and organization code
  getByEmailAndOrgCode: async (email: string, organizationCode: string): Promise<LocalUser | undefined> => {
    try {
      // Find users with matching email
      const usersWithEmail = await db.users.where('email').equals(email).toArray();
      
      // Find the one with matching organization code
      return usersWithEmail.find(user => user.organizationCode === organizationCode);
    } catch (error) {
      console.error(`Error fetching user with email ${email} and org code ${organizationCode}:`, error);
      throw error;
    }
  },

  // Create a new user
  create: async (userData: Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
    try {
      // Validate organization ID if provided
      if (userData.organizationId) {
        const organization = await localOrganizationService.getById(userData.organizationId);
        if (!organization) {
          throw new Error('Organization not found');
        }
        
        // Cache the organization code
        userData.organizationCode = organization.code;
      }

      // Check if user with this email already exists in the same organization
      let existingUser;
      if (userData.organizationId) {
        const usersWithEmail = await db.users.where('email').equals(userData.email).toArray();
        existingUser = usersWithEmail.find(user => user.organizationId === userData.organizationId);
      } else {
        existingUser = await localUserService.getByEmail(userData.email);
      }
      
      if (existingUser) {
        throw new Error('Email is already registered in this organization');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create the user
      const id = await db.users.add({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update a user
  update: async (id: number, userData: Partial<Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> => {
    try {
      // Check if user exists
      const user = await localUserService.getById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Handle password update if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Update the user
      await db.users.update(id, {
        ...userData,
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a user
  delete: async (id: number): Promise<void> => {
    try {
      // Check if user exists
      const user = await localUserService.getById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is an admin with an organization
      if (user.role === UserRole.ADMIN && user.organizationId) {
        const organization = await localOrganizationService.getById(user.organizationId);
        if (organization && organization.adminUserId === id) {
          // Delete the entire organization and all its users
          await localOrganizationService.delete(user.organizationId);
          return; // Organization deletion cascades to users
        }
      }

      // Delete the user
      await db.users.delete(id);
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  },

  // Authenticate a user with email and password (Admin login)
  authenticate: async (email: string, password: string): Promise<{ user: Omit<LocalUser, 'password'>, token: string } | null> => {
    try {
      // Get user by email
      const user = await localUserService.getByEmail(email);
      if (!user || user.role !== UserRole.ADMIN) {
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Generate a fake token (for demo purposes)
      const token = generateFakeToken(user);

      // Return user data without password and token
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  },

  // Authenticate a user with email, password, and organization code (Manager/Basic login)
  authenticateWithOrgCode: async (email: string, password: string, organizationCode: string): Promise<{ user: Omit<LocalUser, 'password'>, token: string } | null> => {
    try {
      // Get user by email and organization code
      const user = await localUserService.getByEmailAndOrgCode(email, organizationCode);
      if (!user || user.role === UserRole.ADMIN) {
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Generate a fake token (for demo purposes)
      const token = generateFakeToken(user);

      // Return user data without password and token
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error authenticating user with organization code:', error);
      throw error;
    }
  },

  // Get users by role
  getByRole: async (role: UserRole): Promise<LocalUser[]> => {
    try {
      console.log(`Searching for users with role: ${role}`);
      const users = await db.users.where('role').equals(role).toArray();
      console.log(`Found ${users.length} users with role ${role}`);
      return users;
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      // Log all users for debugging
      try {
        const allUsers = await db.users.toArray();
        console.log(`Debug - All users in database: ${allUsers.length}`);
        console.log(`User roles: ${allUsers.map(u => u.role).join(', ')}`);
      } catch (e) {
        console.error('Failed to retrieve all users for debugging:', e);
      }
      throw error;
    }
  },

  // Get users by role and organization
  getByRoleAndOrganization: async (role: UserRole, organizationId: number): Promise<LocalUser[]> => {
    try {
      console.log(`Searching for users with role: ${role} in organization: ${organizationId}`);
      const users = await db.users
        .where('role').equals(role)
        .and(user => user.organizationId === organizationId)
        .toArray();
      
      console.log(`Found ${users.length} users with role ${role} in organization ${organizationId}`);
      return users;
    } catch (error) {
      console.error(`Error fetching users with role ${role} in organization ${organizationId}:`, error);
      throw error;
    }
  },

  // Change user role (only admins can create managers, and only admins/managers can create basic users)
  changeRole: async (id: number, role: UserRole, currentUserId: number): Promise<number> => {
    try {
      // Get the user to change
      const userToChange = await localUserService.getById(id);
      if (!userToChange) {
        throw new Error('User not found');
      }

      // Get the current user
      const currentUser = await localUserService.getById(currentUserId);
      if (!currentUser) {
        throw new Error('Current user not found');
      }

      // Ensure users are in the same organization
      if (userToChange.organizationId !== currentUser.organizationId) {
        throw new Error('Cannot change role for a user in a different organization');
      }

      // Check permissions
      if (role === UserRole.ADMIN) {
        throw new Error('Cannot change a user to Admin role');
      }

      if (role === UserRole.MANAGER && currentUser.role !== UserRole.ADMIN) {
        throw new Error('Only admins can create or change to Manager role');
      }

      if (userToChange.role === UserRole.ADMIN) {
        throw new Error('Cannot change role of an Admin user');
      }

      return await localUserService.update(id, { role });
    } catch (error) {
      console.error(`Error changing role for user with ID ${id}:`, error);
      throw error;
    }
  },

  // Toggle user active status
  toggleActive: async (id: number): Promise<number> => {
    try {
      const user = await localUserService.getById(id);
      if (!user) {
        throw new Error('User not found');
      }

      return await localUserService.update(id, { isActive: !user.isActive });
    } catch (error) {
      console.error(`Error toggling active status for user with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new organization and admin user
  createOrganizationWithAdmin: async (
    orgName: string,
    adminName: string,
    adminEmail: string,
    adminPassword: string
  ): Promise<{ organizationId: number, adminId: number, organizationCode: string }> => {
    try {
      // Generate a unique organization code
      const orgCode = await localOrganizationService.generateUniqueCode();
      
      // Create the organization
      const organizationId = await db.organizations.add({
        name: orgName,
        code: orgCode,
        adminUserId: 0, // Will update after creating admin
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create the admin user
      const adminId = await localUserService.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: UserRole.ADMIN,
        isActive: true,
        organizationId,
        organizationCode: orgCode
      });
      
      // Update the organization with the admin user ID
      await db.organizations.update(organizationId, {
        adminUserId: adminId
      });
      
      return { organizationId, adminId, organizationCode: orgCode };
    } catch (error) {
      console.error('Error creating organization with admin:', error);
      throw error;
    }
  }
};

// Helper function to generate a fake token for demo purposes
function generateFakeToken(user: LocalUser): string {
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    organizationCode: user.organizationCode,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  // In a real app, this would use JWT to encrypt the payload
  // For demo purposes, we'll just encode it to simulate a token
  return btoa(JSON.stringify(tokenPayload));
}

export default localUserService; 