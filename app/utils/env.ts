// Environment variables utility functions

/**
 * Get an environment variable with validation
 * 
 * @param {string} key - The environment variable key
 * @param {string} defaultValue - Optional default value if not set
 * @param {boolean} required - Whether the variable is required
 * @returns {string} The environment variable value
 */
export function getEnv(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key] || defaultValue || '';
  
  if (required && !value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value;
}

// Common environment variables
export const ENV = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  MONGODB_URI: getEnv('MONGODB_URI', 'mongodb://localhost:27017/hydropipes_erp'),
  API_URL: getEnv('API_URL', 'http://localhost:3000/api'),
  APP_NAME: 'HydroPipes ERP',
};

// Check if in production environment
export const isProd = ENV.NODE_ENV === 'production';
export const isDev = ENV.NODE_ENV === 'development';
export const isTest = ENV.NODE_ENV === 'test'; 