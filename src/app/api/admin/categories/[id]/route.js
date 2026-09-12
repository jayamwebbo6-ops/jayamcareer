import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import Category from '../../../../../models/Category';
import Form from '../../../../../models/Form';
import Task from '../../../../../models/Task';

const TASK_POPULATE = [
  { path: 'task0_6',    select: 'name content' },
  { path: 'task1',      select: 'name content' },
  { path: 'task2',      select: 'name content' },
  { path: 'taskAbove2', select: 'name content' },
];

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedCategory }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const updatedCategory = await Category.findByIdAndUpdate(id, body, { new: true })
      .populate('formId', 'name')
      .populate(TASK_POPULATE);

    if (!updatedCategory) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCategory }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
