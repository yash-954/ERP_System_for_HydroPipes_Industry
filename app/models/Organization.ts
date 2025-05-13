// Define Organization interface
export interface IOrganization {
  _id?: string;
  name: string;
  code: string;
  adminUserId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Note: We're not creating an actual Mongoose model here since we're using Dexie.js
// for client-side database operations. The model implementation is in app/lib/db/localDb.ts 