import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import Form from '../../../../../models/Form';

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const deletedForm = await Form.findByIdAndDelete(id);
    
    if (!deletedForm) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: deletedForm }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    
    const updatedForm = await Form.findByIdAndUpdate(id, body, { new: true });
    
    if (!updatedForm) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: updatedForm }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
