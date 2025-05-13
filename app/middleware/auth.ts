import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import User, { UserRole } from '../models/User';
import connectDB from '../config/db';

// Interface for extended request with user
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware
 * 
 * @param req - Next.js request
 * @param handler - Route handler function
 * @returns NextResponse
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  try {
    // Connect to database
    await connectDB();
    
    // Extract token from headers
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader || undefined);
    
    // If no token is provided
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // If role-based access control is enabled
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(decoded.role as UserRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    // Attach user to request
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      _id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    
    // Continue to handler
    return handler(authReq);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 