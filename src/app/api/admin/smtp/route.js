import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import SmtpConfig from '../../../../models/SmtpConfig';
import jwt from 'jsonwebtoken';

// Helper function to verify admin token
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

export async function GET(request) {
  try {
    await verifyAdmin(request);
    await connectToDatabase();

    const config = await SmtpConfig.findOne();
    if (!config) {
      return NextResponse.json({ 
        host: '', 
        port: 587, 
        secure: false, 
        user: '', 
        pass: '', 
        from: '',
        cc: '',
        hasPassword: false 
      });
    }

    // Return config but mask password
    return NextResponse.json({
      host: config.host || '',
      port: config.port || 587,
      secure: !!config.secure,
      user: config.user || '',
      pass: '', // Masked password
      from: config.from || '',
      cc: config.cc || '',
      hasPassword: !!config.pass
    });
  } catch (error) {
    console.error('SMTP fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch SMTP config' }, { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 });
  }
}

export async function POST(request) {
  try {
    await verifyAdmin(request);
    await connectToDatabase();

    const { host, port, secure, user, pass, from, cc } = await request.json();

    if (!host || !port || !user || !from) {
      return NextResponse.json({ error: 'Host, Port, User, and From fields are required' }, { status: 400 });
    }

    let config = await SmtpConfig.findOne();

    if (config) {
      config.host = host;
      config.port = Number(port);
      config.secure = Boolean(secure);
      config.user = user;
      config.from = from;
      config.cc = cc || '';
      
      // Update password only if a new one is provided
      if (pass && pass.trim() !== '') {
        config.pass = pass;
      }
      await config.save();
    } else {
      if (!pass || pass.trim() === '') {
        return NextResponse.json({ error: 'Password is required for new SMTP configuration' }, { status: 400 });
      }
      config = new SmtpConfig({
        host,
        port: Number(port),
        secure: Boolean(secure),
        user,
        pass,
        from,
        cc: cc || ''
      });
      await config.save();
    }

    return NextResponse.json({ message: 'SMTP configuration saved successfully!', success: true });
  } catch (error) {
    console.error('SMTP update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save SMTP config' }, { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 });
  }
}
