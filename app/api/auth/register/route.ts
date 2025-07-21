import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../config/db';
import { IUser, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils/jwt';

// Helper function to create a new user
async function createUser(userData: Partial<IUser>): Promise<IUser | null> {
  // Implement this function based on your data access method
  // This is a placeholder
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Parse request body
    const body = await req.json();
    const { name, email, password, role = UserRole.BASIC } = body;
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create new user
    const newUser = await createUser({
      name,
      email,
      password,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: newUser._id?.toString() || '',
      email: newUser.email,
      role: newUser.role,
    });
    
    // Return user data and token
    return NextResponse.json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

// Helper function to find a user by email
async function findUserByEmail(email: string): Promise<IUser | null> {
  // Implement this function based on your data access method
  // This is a placeholder
  return null;
} 