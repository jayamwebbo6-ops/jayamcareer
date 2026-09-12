import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Application from '../../../../models/Application';
import TaskForm from '../../../../models/TaskForm';

export async function POST(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json({ success: false, message: 'Application ID is required' }, { status: 400 });
    }

    const { answers } = await request.json();
    if (!answers) {
      return NextResponse.json({ success: false, message: 'Answers are required' }, { status: 400 });
    }

    const application = await Application.findById(applicationId).populate('categoryId');
    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    const exp = (application.staticData?.experience || '').toString().trim().toLowerCase();
    
    // Resolve expKey
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
        message: 'No task form has been created for this category and experience range' 
      }, { status: 404 });
    }

    // Evaluate answers
    const taskScores = {};
    let taskTotalScore = 0;
    let taskMaxScore = 0;

    taskForm.customSections.forEach(section => {
      section.questions.forEach(q => {
        const candidateAnswer = answers[q.id];
        const marks = Number(q.marks) || 1;
        taskMaxScore += marks;

        let questionScore = 0;

        if (q.type === 'radio') {
          const selectedIdx = q.options ? q.options.indexOf(candidateAnswer) : -1;
          if (selectedIdx !== -1) {
            questionScore = (q.optionMarks && q.optionMarks[selectedIdx] !== undefined) ? q.optionMarks[selectedIdx] : 0;
          } else {
            questionScore = 0;
          }
        } else if (q.type === 'checkbox') {
          const candidateAnswersList = Array.isArray(candidateAnswer) ? candidateAnswer : [];
          let earnedScore = 0;
          if (q.options) {
            q.options.forEach((opt, optIndex) => {
              if (candidateAnswersList.includes(opt)) {
                const optMark = (q.optionMarks && q.optionMarks[optIndex] !== undefined) ? q.optionMarks[optIndex] : 0;
                earnedScore += optMark;
              }
            });
          }
          questionScore = earnedScore;
        } else if (q.type === 'text') {
          if (candidateAnswer && typeof candidateAnswer === 'string' && candidateAnswer.trim() !== '') {
            questionScore = marks;
          } else {
            questionScore = 0;
          }
        } else {
          questionScore = 0;
        }

        taskScores[q.id] = questionScore;
        taskTotalScore += questionScore;
      });
    });

    // Update Application
    application.taskAnswers = answers;
    application.taskScores = taskScores;
    application.taskTotalScore = Math.round(taskTotalScore * 100) / 100;
    application.taskMaxScore = taskMaxScore;
    application.status = 'Task Submitted - Submitted';
    application.taskSubmittedAt = new Date();
    
    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully',
      data: {
        totalScore: application.taskTotalScore,
        maxScore: application.taskMaxScore
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error submitting task answers:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
