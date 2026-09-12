import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongoDb';
import Application from '../../../models/Application';
import TaskForm from '../../../models/TaskForm';
import Category from '../../../models/Category'; // Register Category schema in mongoose

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ success: false, message: 'Application ID is required' }, { status: 400 });
    }

    const application = await Application.findById(applicationId).populate('categoryId');
    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    const exp = (application.staticData?.experience || '').toString().trim().toLowerCase();
    
    // Resolve expKey matching the email template resolution
    let expKey = '';
    if (exp.includes('0-6') || exp === 'fresher') {
      expKey = 'task0_6';
    } else if (exp.includes('6-1') || exp.includes('6 months') || exp.includes('1 year')) {
      expKey = 'task1';
    } else if (exp.includes('1-2') || exp.includes('2 year') || exp.includes('1 to 2')) {
      expKey = 'task2';
    } else if (exp.includes('2+') || exp.includes('above') || exp.includes('more than 2')) {
      expKey = 'taskAbove2';
    } else {
      // Fallback
      expKey = 'task0_6';
    }

    // Find the matching TaskForm
    const taskForm = await TaskForm.findOne({ 
      jobCategory: application.categoryId._id, 
      experience: expKey 
    });

    if (!taskForm) {
      return NextResponse.json({ 
        success: false, 
        message: 'No custom task form has been created for this category and experience range' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        form: taskForm,
        candidateName: application.fullName,
        categoryName: application.categoryId.name
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching task form for submission:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
