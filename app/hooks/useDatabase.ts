'use client';

import { useEffect, useState } from 'react';
import { getLocalDb, seedDatabase, db } from '../lib/db/localDb';

/**
 * Hook to ensure the database is properly initialized and seeded
 */
export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeDatabase() {
      try {
        console.log('Initializing database...');
        
        // First check if the database exists and is open
        if (!db.isOpen()) {
          console.log('Database is not open, opening it now');
          await db.open();
        }
        
        // Get the database instance
        const dbInstance = getLocalDb();
        
        // Check if there are any users in the database
        const userCount = await db.users.count();
        console.log(`Database initialization check: Found ${userCount} existing users`);
        
        // If no users exist, force seed the database
        if (userCount === 0) {
          console.log('No users found, forcing database seeding');
          await seedDatabase(true).catch(err => {
            console.error('Error during forced database seeding:', err);
            if (isMounted) {
              setError(err instanceof Error ? err : new Error(String(err)));
            }
          });
          
          // Verify seeding worked
          const newUserCount = await db.users.count();
          console.log(`After seeding: Found ${newUserCount} users`);
          
          if (newUserCount === 0) {
            throw new Error('Database seeding failed - no users were created');
          }
        }
        
        console.log('Database initialization complete');
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    initializeDatabase();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return { isInitialized, error };
}

export default useDatabase; 