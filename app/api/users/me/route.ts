import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '../../../utils/auth';
import { IUser } from '../../../models/User';

// Helper function to find a user by ID
async function findUserById(userId: string): Promise<IUser | null> {
  // Implement this function based on your data access method
  // This is a placeholder
  return null;
}

export async function GET(req: NextRequest) {
  try {
    // Get token data from auth header
    const tokenData = getTokenData(req);
    
    if (!tokenData || !tokenData.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find user by ID
    const user = await findUserById(tokenData.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data (excluding password)
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 