import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Category from '../../../../models/Category';
import Form from '../../../../models/Form';
import Task from '../../../../models/Task';
// Touch to force recompilation after fixing Form model export issue

export const dynamic = 'force-dynamic';

const TASK_POPULATE = [
  { path: 'task0_6',    select: 'name content' },
  { path: 'task1',      select: 'name content' },
  { path: 'task2',      select: 'name content' },
  { path: 'taskAbove2', select: 'name content' },
];

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({})
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate('formId', 'name')
      .populate(TASK_POPULATE);
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    if (body.displayOrder === undefined) {
      const lastCategory = await Category.findOne({}).sort({ displayOrder: -1 });
      body.displayOrder = lastCategory ? lastCategory.displayOrder + 1 : 0;
    }
    const category = await Category.create(body);
    const populated = await Category.findById(category._id)
      .populate('formId', 'name')
      .populate(TASK_POPULATE);
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
