import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import Application from '../../../../../models/Application';
import Category from '../../../../../models/Category';
import Task from '../../../../../models/Task';
import TaskForm from '../../../../../models/TaskForm';
import { sendTaskEmail, sendThankYouEmail, sendCustomEmail } from '../../../../../lib/services/email';
import jwt from 'jsonwebtoken';

async function verifyAdmin(request) {
  const token = request.cookies.get('jayamadmin_token')?.value;
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded || !decoded.adminId) {
    throw new Error('Invalid token');
  }

  return decoded.adminId;
}

// Helper to safely get task properties
const getTaskRef = (taskObj) => {
  if (!taskObj) return { content: '', taskLink: '' };
  return {
    content: taskObj.content || '',
    taskLink: taskObj.taskLink || (taskObj.taskLinks && taskObj.taskLinks[0]?.url) || ''
  };
};

function resolveCandidateTask(category, exp) {
  const expLower = (exp || '').toLowerCase();
  let taskRef;
  let expKey = '';

  if (expLower.includes('0-6') || expLower === 'fresher') {
    taskRef = getTaskRef(category.task0_6);
    expKey = 'task0_6';
  } else if (expLower.includes('6-1') || expLower.includes('6 months') || expLower.includes('1 year')) {
    taskRef = getTaskRef(category.task1);
    expKey = 'task1';
  } else if (expLower.includes('1-2') || expLower.includes('2 year') || expLower.includes('1 to 2')) {
    taskRef = getTaskRef(category.task2);
    expKey = 'task2';
  } else if (expLower.includes('2+') || expLower.includes('above') || expLower.includes('more than 2')) {
    taskRef = getTaskRef(category.taskAbove2);
    expKey = 'taskAbove2';
  } else {
    // fallback: pick first non-empty
    if (getTaskRef(category.taskAbove2).content) {
      taskRef = getTaskRef(category.taskAbove2);
      expKey = 'taskAbove2';
    } else if (getTaskRef(category.task2).content) {
      taskRef = getTaskRef(category.task2);
      expKey = 'task2';
    } else if (getTaskRef(category.task1).content) {
      taskRef = getTaskRef(category.task1);
      expKey = 'task1';
    } else {
      taskRef = getTaskRef(category.task0_6);
      expKey = 'task0_6';
    }
  }

  if (!taskRef || !taskRef.content || !taskRef.content.trim()) {
    const levels = ['task0_6', 'task1', 'task2', 'taskAbove2'];
    for (const lvl of levels) {
      const candidate = getTaskRef(category[lvl]);
      if (candidate && candidate.content && candidate.content.trim()) {
        taskRef = candidate;
        expKey = lvl;
        break;
      }
    }
  }

  return { taskRef, expKey };
}

export async function POST(request) {
  try {
    await verifyAdmin(request);
    await connectToDatabase();

    const body = await request.json();
    const {
      action,
      applicationId,
      emailType = 'task', // 'task' | 'thankyou' | 'custom'
      customSubject,
      customMessage,
      customTaskLink,
      customTaskFormLink
    } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required.' }, { status: 400 });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Candidate application not found.' }, { status: 404 });
    }

    const category = await Category.findById(application.categoryId)
      .populate('task0_6', 'content taskLinks')
      .populate('task1', 'content taskLinks')
      .populate('task2', 'content taskLinks')
      .populate('taskAbove2', 'content taskLinks');

    const categoryName = category?.name || 'Applicant';
    const candidateExp = application.staticData?.experience || '';
    const { taskRef, expKey } = category ? resolveCandidateTask(category, candidateExp) : { taskRef: { content: '', taskLink: '' }, expKey: '' };

    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;
    const basePath = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
    const baseURL = origin + basePath;

    // Check TaskForm
    let taskFormLink = '';
    if (expKey && category) {
      const matchingForm = await TaskForm.findOne({ jobCategory: category._id, experience: expKey });
      if (matchingForm) {
        const categorySlug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        taskFormLink = `${baseURL}/submit-task/${categorySlug}?id=${application._id}`;
      }
    }

    // If client requested preview details
    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        candidate: {
          id: application._id,
          fullName: application.fullName,
          email: application.email,
          categoryName,
          experience: candidateExp,
          emailSent: !!application.emailSent,
          lastEmailSentAt: application.lastEmailSentAt,
          lastEmailType: application.lastEmailType
        },
        task: {
          content: taskRef.content || '',
          taskLink: taskRef.taskLink || '',
          taskFormLink
        },
        defaultTaskSubject: `Interview Task for ${categoryName} - Jayam Web Solutions`,
        defaultThankYouSubject: `Application Received: ${categoryName} - Jayam Web Solutions`
      });
    }

    // Handle sending the email
    const email = application.email;
    if (!email) {
      return NextResponse.json({ error: 'Candidate has no email address.' }, { status: 400 });
    }

    if (emailType === 'task') {
      const taskContentToSend = customMessage !== undefined ? customMessage : taskRef.content;
      const taskLinkToSend = customTaskLink !== undefined ? customTaskLink : taskRef.taskLink;
      const taskFormLinkToSend = customTaskFormLink !== undefined ? customTaskFormLink : taskFormLink;

      if (!taskContentToSend || !taskContentToSend.trim()) {
        return NextResponse.json({ error: 'Interview task content is empty for this role and experience. Please enter task details or choose Thank You email.' }, { status: 400 });
      }

      await sendTaskEmail({
        email,
        fullName: application.fullName,
        categoryName,
        taskContent: taskContentToSend,
        taskLink: taskLinkToSend,
        taskFormLink: taskFormLinkToSend,
        baseURL
      });

      application.emailSent = true;
      application.lastEmailSentAt = new Date();
      application.lastEmailType = 'Interview Task';
      await application.save();

      return NextResponse.json({
        success: true,
        message: `Interview Task email sent successfully to ${email}!`
      });
    } else if (emailType === 'thankyou') {
      await sendThankYouEmail({
        email,
        fullName: application.fullName,
        categoryName,
        baseURL
      });

      application.emailSent = true;
      application.lastEmailSentAt = new Date();
      application.lastEmailType = 'Thank You';
      await application.save();

      return NextResponse.json({
        success: true,
        message: `Thank You email sent successfully to ${email}!`
      });
    } else if (emailType === 'custom') {
      if (!customSubject || !customMessage) {
        return NextResponse.json({ error: 'Subject and message are required for custom email.' }, { status: 400 });
      }

      const formattedHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo1" alt="Jayam Web Solutions Logo" style="height: 50px; max-width: 100%; object-fit: contain;" />
        </div>
        <div style="background-color: #ff6600; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 18px;">${customSubject}</h2>
        </div>
        <div style="padding: 20px 10px; font-size: 14px; color: #333;">
          <p>Hi <strong>${application.fullName}</strong>,</p>
          <div style="white-space: pre-wrap; margin: 15px 0;">${customMessage.replace(/\n/g, '<br/>')}</div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <div style="font-size: 12px; color: #888; text-align: center;">
          <strong>JAYAM WEB SOLUTIONS</strong><br/>
          Tambaram<br/>
          <a href="http://www.jayamwebsolutions.com" style="color: #ff6600; text-decoration: none;">www.jayamwebsolutions.com</a>
        </div>
      </div>`;

      await sendCustomEmail({
        to: email,
        subject: customSubject,
        text: customMessage,
        html: formattedHtml
      });

      application.emailSent = true;
      application.lastEmailSentAt = new Date();
      application.lastEmailType = 'Custom';
      await application.save();

      return NextResponse.json({
        success: true,
        message: `Custom email sent successfully to ${email}!`
      });
    }

    return NextResponse.json({ error: 'Invalid emailType.' }, { status: 400 });
  } catch (error) {
    console.error('Manual email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email.' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}
