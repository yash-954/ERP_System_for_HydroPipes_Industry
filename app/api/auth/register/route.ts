import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../config/db';
import User, { UserRole } from '../../../models/User';
import { generateToken } from '../../../utils/jwt';

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
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      isActive: true,
    });
    
    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
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
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
} 