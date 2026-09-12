import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongoDb';

export async function GET() {
  try {
    // Attempt to connect to the database
    await connectToDatabase();
    
    return NextResponse.json({
      message: 'Test API is working perfectly!',
      database: 'Connected successfully to MongoDB',
      status: 'success',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Test API DB Connection Error:', error);
    
    return NextResponse.json({
      message: 'Test API is working, but database connection failed.',
      database: 'Disconnected',
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
