import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../../lib/mongoDb';
import Application from '../../../../../../models/Application';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { taskScores, taskTotalScore } = await req.json();

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    application.taskScores = taskScores;
    application.taskTotalScore = Math.round(taskTotalScore * 100) / 100;
    application.taskEvaluated = true;
    
    await application.save();

    return NextResponse.json({ success: true, data: application }, { status: 200 });
  } catch (error) {
    console.error('Error evaluating application task:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
