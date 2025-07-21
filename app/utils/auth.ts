import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

interface TokenData {
  userId: string;
  email: string;
  role: string;
}

/**
 * Extract and verify JWT token from request headers
 */
export function getTokenData(req: NextRequest): TokenData | null {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return null;
    }
    
    // Verify token and return data
    return verifyToken(token) as TokenData;
  } catch (error) {
    console.error('Error extracting token data:', error);
    return null;
  }
} 