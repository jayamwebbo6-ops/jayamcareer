import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Form from '../../../../models/Form';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const forms = await Form.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: forms }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const form = await Form.create(body);
    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
