import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import Task from '../../../../../models/Task';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    if (!body.name?.trim() || !body.content?.trim()) {
      return NextResponse.json({ success: false, message: 'Name and content are required.' }, { status: 400 });
    }
    const task = await Task.findByIdAndUpdate(
      id,
      {
        name:      body.name.trim(),
        content:   body.content.trim(),
        taskLinks: body.taskLinks || [],
      },
      { new: true }
    );
    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: task }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
