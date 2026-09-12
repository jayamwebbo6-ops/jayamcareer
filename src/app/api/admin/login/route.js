import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Admin from '../../../../models/Admin';
import AdminOTP from '../../../../models/AdminOTP';
import { sendCustomEmail } from '../../../../lib/services/email';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, otp, action } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Auto-seed if database has NO admins at all
    let adminDoc = await Admin.findOne();
    if (!adminDoc) {
      adminDoc = new Admin({ emails: ['jayamwebsolutionspvtltd@gmail.com'] });
      await adminDoc.save();
    }

    const isAuthorized = adminDoc.emails.some(e => e.toLowerCase() === lowerEmail);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'This email is not authorized as admin.' }, { status: 401 });
    }

    if (action === 'send-otp') {
      // Generate 6-digit OTP code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

      // Save or update OTP in DB
      await AdminOTP.findOneAndUpdate(
        { email: lowerEmail },
        { otp: generatedOtp, expiresAt },
        { upsert: true, new: true }
      );

      // Send email
      try {
        await sendCustomEmail({
          to: lowerEmail,
          subject: 'Admin OTP Login Code - Jayam Web Solutions',
          text: `Your admin login OTP is: ${generatedOtp}. This code is valid for 5 minutes.`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo1" alt="Jayam Web Solutions Logo" style="height: 45px; object-fit: contain;" />
            </div>
            <div style="background-color: #ff6600; padding: 12px; border-radius: 6px; text-align: center; color: white; margin-bottom: 20px;">
              <h3 style="margin: 0; font-size: 18px;">Admin OTP Code</h3>
            </div>
            <p>Your one-time password (OTP) to log in to the admin panel is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #ff6600; padding: 15px; background: #fafafa; border-radius: 6px; text-align: center; letter-spacing: 5px; margin: 20px 0; border: 1px solid #eee;">
              ${generatedOtp}
            </div>
            <p style="font-size: 13px; color: #666;">This code is valid for <strong>5 minutes</strong>. If you did not request this login code, you can safely ignore this email.</p>
          </div>`
        });
      } catch (emailErr) {
        console.error('Failed to send OTP email:', emailErr);
        return NextResponse.json({ error: 'Failed to send OTP email. Please verify SMTP settings.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'OTP sent successfully.' });
    }

    if (action === 'verify-otp') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
      }

      const otpRecord = await AdminOTP.findOne({ email: lowerEmail });
      if (!otpRecord || otpRecord.otp !== otp.trim() || otpRecord.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired OTP code.' }, { status: 401 });
      }

      // Valid OTP: delete it so it cannot be reused
      await AdminOTP.deleteOne({ _id: otpRecord._id });

      // Generate JWT
      const token = jwt.sign(
        { adminId: adminDoc._id, email: lowerEmail },
        process.env.JWT_SECRET ,
        { expiresIn: '7d' }
      );

      // Set cookie securely
      const response = NextResponse.json({ message: 'Login successful', success: true });
      response.cookies.set({
        name: 'jayamadmin_token',
        value: token,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
