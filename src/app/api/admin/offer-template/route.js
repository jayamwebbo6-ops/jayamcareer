import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import OfferTemplate from '../../../../models/OfferTemplate';
import jwt from 'jsonwebtoken';

const DEFAULT_SUBJECT = 'Job Offer Confirmation - Jayam Web Solutions';
const DEFAULT_BODY = `Dear Mr./Ms. {{candidateName}},

Job Position: {{jobPosition}}

We are pleased to offer you the position of {{jobPosition}} at our company, effective from {{startDate}}. Your monthly salary will be {{salary}} INR.

Salary will be paid on the 10th of each month.

Documents to Submit (eCopy): {{documents}}

Working Hours: {{workingHours}}

Notice Period: {{noticePeriod}}

Best Wishes!

NOTE: A minimum tenure of one year with the company is required.
--
Thanks & Regards,
Lakshmi L
Project Manager
Jayam Web Solutions Pvt Ltd
+91 9677 87 6445 / 98405 99789
www.jayamwebsolutions.com`;

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

    let template = await OfferTemplate.findOne();
    if (!template) {
      template = new OfferTemplate({
        subject: DEFAULT_SUBJECT,
        body: DEFAULT_BODY
      });
      await template.save();
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Fetch template error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch template' }, { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 });
  }
}

export async function POST(request) {
  try {
    await verifyAdmin(request);
    await connectToDatabase();

    const { subject, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and Body are required' }, { status: 400 });
    }

    let template = await OfferTemplate.findOne();
    if (template) {
      template.subject = subject;
      template.body = body;
      await template.save();
    } else {
      template = new OfferTemplate({ subject, body });
      await template.save();
    }

    return NextResponse.json({ success: true, message: 'Template saved successfully!', data: template });
  } catch (error) {
    console.error('Save template error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save template' }, { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 });
  }
}
