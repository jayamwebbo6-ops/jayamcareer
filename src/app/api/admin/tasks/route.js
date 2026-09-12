import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Task from '../../../../models/Task';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: tasks }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    if (!body.name?.trim() || !body.content?.trim()) {
      return NextResponse.json({ success: false, message: 'Name and content are required.' }, { status: 400 });
    }
    const task = await Task.create({
      name:      body.name.trim(),
      content:   body.content.trim(),
      taskLinks: body.taskLinks || [],
    });
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
