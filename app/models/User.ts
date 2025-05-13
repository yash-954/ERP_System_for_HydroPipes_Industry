// Define user roles as enum for type safety
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  BASIC = 'BASIC'
}

// Define User interface
export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Note: We're not creating an actual Mongoose model here since we're using Dexie.js
// for client-side database operations. The model implementation is in app/lib/db/localDb.ts 