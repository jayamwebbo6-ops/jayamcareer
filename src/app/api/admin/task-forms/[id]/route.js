import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import TaskForm from '../../../../../models/TaskForm';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const form = await TaskForm.findById(id).populate('jobCategory');
    if (!form) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: form }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const form = await TaskForm.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!form) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: form }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const form = await TaskForm.findByIdAndDelete(id);
    if (!form) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Form deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
