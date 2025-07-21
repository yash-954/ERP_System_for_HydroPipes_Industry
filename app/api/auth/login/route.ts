import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../config/db';
import { IUser } from '../../../models/User';
import { generateToken } from '../../../utils/jwt';

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Parse request body
    const body = await req.json();
    const { email, password } = body;
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email - This needs to be updated to use your actual data access method
    // Since we're not using Mongoose directly, we need to adapt this code
    // to work with your local database implementation
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password - This also needs to be adapted to your implementation
    const isPasswordValid = await verifyPassword(user, password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user._id?.toString() || '',
      email: user.email,
      role: user.role,
    });
    
    // Return user data and token
    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Helper functions that need to be implemented based on your data access method
async function findUserByEmail(email: string): Promise<IUser | null> {
  // Implement this function based on your data access method
  // This is a placeholder
  return null;
}

async function verifyPassword(user: IUser, password: string): Promise<boolean> {
  // Implement this function based on your password verification method
  // This is a placeholder
  return false;
} 