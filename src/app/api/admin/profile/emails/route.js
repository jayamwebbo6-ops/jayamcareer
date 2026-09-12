import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import Admin from '../../../../../models/Admin';
import jwt from 'jsonwebtoken';

async function verifyAdmin(request) {
  const token = request.cookies.get('jayamadmin_token')?.value;
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET 
  );

  if (!decoded || !decoded.adminId) {
    throw new Error('Invalid token');
  }

  return decoded;
}

export async function GET(request) {
  try {
    await verifyAdmin(request);
    await connectToDatabase();

    let adminDoc = await Admin.findOne();
    if (!adminDoc) {
      adminDoc = new Admin({ emails: ['jayamwebsolutionspvtltd@gmail.com'] });
      await adminDoc.save();
    }

    return NextResponse.json({ success: true, emails: adminDoc.emails });
  } catch (error) {
    console.error('Fetch emails error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails.' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    await verifyAdmin(request);
    await connectToDatabase();

    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one admin email is required.' }, { status: 400 });
    }

    // Clean and validate emails
    const cleanEmails = emails
      .map(e => e.trim().toLowerCase())
      .filter(e => e !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (cleanEmails.length === 0) {
      return NextResponse.json({ error: 'Please enter at least one valid email address.' }, { status: 400 });
    }

    let adminDoc = await Admin.findOne();
    if (!adminDoc) {
      adminDoc = new Admin({ emails: cleanEmails });
    } else {
      adminDoc.emails = cleanEmails;
    }

    await adminDoc.save();

    return NextResponse.json({ success: true, emails: adminDoc.emails, message: 'Admin emails updated successfully.' });
  } catch (error) {
    console.error('Update emails error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update emails.' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}
