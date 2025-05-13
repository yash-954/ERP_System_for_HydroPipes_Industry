// Define Department/Team interface
export interface IDepartment {
  _id?: string;
  name: string;
  description?: string;
  managerId: number;
  organizationId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define TeamMember interface for department members
export interface ITeamMember {
  _id?: string;
  departmentId: number;
  userId: number;
  role: TeamRole;
  joinedAt: Date;
}

// Team role enum (different from user role)
export enum TeamRole {
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER'
}

// Default departments
export const DEFAULT_DEPARTMENTS = [
  {
    name: 'Management',
    description: 'Executive management team'
  },
  {
    name: 'Sales',
    description: 'Sales and marketing team'
  },
  {
    name: 'Operations',
    description: 'Operations and logistics team'
  },
  {
    name: 'Engineering',
    description: 'Engineering and development team'
  },
  {
    name: 'Finance',
    description: 'Finance and accounting team'
  },
  {
    name: 'HR',
    description: 'Human resources team'
  }
]; 