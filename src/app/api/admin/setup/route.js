import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Admin from '../../../../models/Admin';

// Important: Delete or secure this route in production!
export async function GET(request) {
  try {
    await connectToDatabase();

    // Check if an admin already exists to prevent overwriting/creating duplicates
    const existingAdmin = await Admin.findOne({});
    
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists. Setup skipped.' });
    }

    // Create default admin user
    const defaultAdmin = new Admin({
      username: 'admin',
      password: 'password123' // This will be hashed by the pre-save hook in Admin.js
    });

    await defaultAdmin.save();

    return NextResponse.json({ 
      message: 'Initial admin user created successfully!', 
      credentials: {
        username: 'admin',
        password: 'password123'
      },
      warning: 'Please delete the /api/admin/setup route or change the password immediately.'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
