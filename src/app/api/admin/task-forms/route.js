import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import TaskForm from '../../../../models/TaskForm';
import Category from '../../../../models/Category'; // Import Category model so mongoose registers the schema for populate

import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Programmatically drop the legacy unique index if present
    try {
      await mongoose.connection.db.collection('taskforms').dropIndex('categoryId_1_experienceLevel_1');
      console.log('Successfully dropped legacy index categoryId_1_experienceLevel_1');
    } catch (e) {
      // Index does not exist or already dropped
    }

    const forms = await TaskForm.find({}).populate('jobCategory').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: forms }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const form = await TaskForm.create(body);
    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch (error) {
    console.error("TaskForm POST Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message,
      stack: error.stack,
      errors: error.errors 
    }, { status: 400 });
  }
}
