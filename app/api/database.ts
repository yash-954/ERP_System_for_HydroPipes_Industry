import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../config/db';

// Middleware to connect to the database for all API routes
export async function withDatabase(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  try {
    // Connect to the database
    await connectDB();
    
    // Process the request
    return await handler(req);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 