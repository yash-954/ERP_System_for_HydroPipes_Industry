import jwt from 'jsonwebtoken';
import { getEnv } from './env';

const JWT_SECRET = getEnv('JWT_SECRET', 'your-secret-key-change-in-production');
const JWT_EXPIRES_IN = getEnv('JWT_EXPIRES_IN', '7d');

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT token
 * 
 * @param payload - User data to include in token
 * @returns JWT token string
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify a JWT token
 * 
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract token from authorization header
 * 
 * @param authHeader - Authorization header from request
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
} 