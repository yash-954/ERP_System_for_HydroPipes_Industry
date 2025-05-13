import { db, LocalOrganization } from '../db/localDb';

// Service for handling organization operations
export const localOrganizationService = {
  // Get all organizations
  getAll: async (): Promise<LocalOrganization[]> => {
    try {
      return await db.organizations.toArray();
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  },

  // Get organization by ID
  getById: async (id: number): Promise<LocalOrganization | undefined> => {
    try {
      return await db.organizations.get(id);
    } catch (error) {
      console.error(`Error fetching organization with ID ${id}:`, error);
      throw error;
    }
  },

  // Get organization by code
  getByCode: async (code: string): Promise<LocalOrganization | undefined> => {
    try {
      return await db.organizations.where('code').equals(code).first();
    } catch (error) {
      console.error(`Error fetching organization with code ${code}:`, error);
      throw error;
    }
  },

  // Get organization by admin user ID
  getByAdminUserId: async (adminUserId: number): Promise<LocalOrganization | undefined> => {
    try {
      return await db.organizations.where('adminUserId').equals(adminUserId).first();
    } catch (error) {
      console.error(`Error fetching organization with admin user ID ${adminUserId}:`, error);
      throw error;
    }
  },

  // Create a new organization
  create: async (organizationData: Omit<LocalOrganization, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
    try {
      // Check if organization with this code already exists
      const existingOrganization = await localOrganizationService.getByCode(organizationData.code);
      if (existingOrganization) {
        throw new Error('Organization code is already in use');
      }

      // Create the organization
      const id = await db.organizations.add({
        ...organizationData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  },

  // Update an organization
  update: async (id: number, organizationData: Partial<Omit<LocalOrganization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> => {
    try {
      // Check if organization exists
      const organization = await localOrganizationService.getById(id);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // If updating the code, check if it's already in use
      if (organizationData.code && organizationData.code !== organization.code) {
        const existingOrganization = await localOrganizationService.getByCode(organizationData.code);
        if (existingOrganization && existingOrganization.id !== id) {
          throw new Error('Organization code is already in use');
        }
      }

      // Update the organization
      await db.organizations.update(id, {
        ...organizationData,
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error(`Error updating organization with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete an organization
  delete: async (id: number): Promise<void> => {
    try {
      // Check if organization exists
      const organization = await localOrganizationService.getById(id);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Delete all users associated with this organization
      await db.users.where('organizationId').equals(id).delete();

      // Delete the organization
      await db.organizations.delete(id);
    } catch (error) {
      console.error(`Error deleting organization with ID ${id}:`, error);
      throw error;
    }
  },

  // Generate a unique organization code
  generateUniqueCode: async (): Promise<string> => {
    try {
      const generateCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        
        // Generate a 6-character code
        for (let i = 0; i < 6; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          code += characters.charAt(randomIndex);
        }
        
        return code;
      };

      // Generate and verify uniqueness
      let code = generateCode();
      let existingOrganization = await localOrganizationService.getByCode(code);
      
      // Keep generating until we find a unique code (just in case)
      let attempts = 0;
      while (existingOrganization && attempts < 10) {
        code = generateCode();
        existingOrganization = await localOrganizationService.getByCode(code);
        attempts++;
      }

      if (existingOrganization) {
        throw new Error('Failed to generate a unique organization code');
      }

      return code;
    } catch (error) {
      console.error('Error generating unique organization code:', error);
      throw error;
    }
  }
};

export default localOrganizationService; 