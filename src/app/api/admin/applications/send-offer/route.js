import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import Application from '../../../../../models/Application';
import { sendCustomEmail } from '../../../../../lib/services/email';
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

  return decoded.adminId;
}

export async function POST(request) {
  try {
    await verifyAdmin(request);
    await connectToDatabase();

    const { applicationId, email, subject, body, status } = await request.json();

    if (!applicationId || !email || !subject || !body) {
      return NextResponse.json({ error: 'applicationId, email, subject, and body are required' }, { status: 400 });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Candidate application not found' }, { status: 404 });
    }

    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/jayamcareer';
    
    // Replace raw newlines with HTML breaks for visual email formatting
    const formattedHtmlBody = body.replace(/\n/g, '<br/>');

    const htmlEmail = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 25px;">
        <img src="${baseURL}/logo1.png" alt="Jayam Web Solutions Logo" style="height: 50px; max-width: 100%; object-fit: contain;" />
      </div>
      <div style="background-color: #ff6600; padding: 15px; border-radius: 8px; text-align: center; color: white; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">Job Offer Confirmation</h2>
      </div>
      <div style="padding: 10px 5px; font-size: 15px; color: #333333;">
        ${formattedHtmlBody}
      </div>
    </div>`;

    // Send the email
    await sendCustomEmail({
      to: email,
      subject,
      text: body,
      html: htmlEmail
    });

    // Update status in database
    application.status = status || 'Final Result - Selected';
    await application.save();

    return NextResponse.json({ success: true, message: 'Offer email sent and status updated successfully!' });
  } catch (error) {
    console.error('Send offer letter error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send offer letter' }, { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 });
  }
}
