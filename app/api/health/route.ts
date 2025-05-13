import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../config/db';

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    await connectDB();
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'API is healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Health check failed',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 