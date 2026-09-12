import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongoDb';
import Application from '../../../models/Application';
import Category from '../../../models/Category';
import Task from '../../../models/Task';
import TaskForm from '../../../models/TaskForm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { sendTaskEmail, sendThankYouEmail } from '../../../lib/services/email';
import { saveFile, deleteFile } from '../../../lib/fileUpload';
import SmtpConfig from '../../../models/SmtpConfig';

export async function POST(request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();

    const categoryId = formData.get('categoryId');
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const mobile = formData.get('mobile');
    const staticDataStr = formData.get('staticData');
    const dynamicDataStr = formData.get('dynamicData');
    const resumeFile = formData.get('resume');

    if (!categoryId || !fullName || !email || !resumeFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const category = await Category.findById(categoryId)
      .populate('task0_6',    'content taskLinks')
      .populate('task1',      'content taskLinks')
      .populate('task2',      'content taskLinks')
      .populate('taskAbove2', 'content taskLinks');
    if (!category) {
      return NextResponse.json({ error: 'Job category not found' }, { status: 404 });
    }
    if (!category.isActive) {
      return NextResponse.json({ error: 'This job opening is inactive and no longer accepting applications' }, { status: 400 });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address containing @ and a valid domain extension' }, { status: 400 });
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (mobile && !mobileRegex.test(mobile)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume file size must be less than 5MB' }, { status: 400 });
    }

    // Save resume file
    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const ext = resumeFile.name.split('.').pop() || 'pdf';
    const filename = `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

    await saveFile(buffer, 'uploads/resumes', filename);

    const resumePath = `/uploads/resumes/${filename}`;

    const staticData = staticDataStr ? JSON.parse(staticDataStr) : {};
    const dynamicData = dynamicDataStr ? JSON.parse(dynamicDataStr) : {};

    const application = await Application.create({
      categoryId,
      fullName,
      email,
      mobile,
      resume: resumePath,
      staticData,
      dynamicData,
    });

    let isAutoEmailEnabled = true;

    // Send task or thank you email to the candidate's email address
    try {
      const exp = (staticData.experience || '').toString().trim().toLowerCase();

      // Extract both content and the active taskLink from a Task ref (populated object or legacy string)
      const getTask = (taskRef) => {
        if (!taskRef) return { content: '', taskLink: '' };
        if (typeof taskRef === 'string') return { content: taskRef, taskLink: '' };  // legacy
        if (typeof taskRef === 'object') {
          // Find the active link if multiple links exist
          let activeLink = '';
          if (Array.isArray(taskRef.taskLinks)) {
            const activeObj = taskRef.taskLinks.find(link => link.isActive === true);
            if (activeObj) activeLink = activeObj.url;
          }
          return {
            content:  taskRef.content  || '',
            taskLink: activeLink || taskRef.taskLink || '', // fallback to legacy taskLink string
          };
        }
        return { content: '', taskLink: '' };
      };

      let taskRef;
      let expKey = '';
      if (exp.includes('0-6') || exp === 'fresher') {
        taskRef = getTask(category.task0_6);
        expKey = 'task0_6';
      } else if (exp.includes('6-1') || exp.includes('6 months') || exp.includes('1 year')) {
        taskRef = getTask(category.task1);
        expKey = 'task1';
      } else if (exp.includes('1-2') || exp.includes('2 year') || exp.includes('1 to 2')) {
        taskRef = getTask(category.task2);
        expKey = 'task2';
      } else if (exp.includes('2+') || exp.includes('above') || exp.includes('more than 2')) {
        taskRef = getTask(category.taskAbove2);
        expKey = 'taskAbove2';
      } else {
        // fallback: pick the first non-empty one
        if (getTask(category.taskAbove2).content) {
          taskRef = getTask(category.taskAbove2);
          expKey = 'taskAbove2';
        } else if (getTask(category.task2).content) {
          taskRef = getTask(category.task2);
          expKey = 'task2';
        } else if (getTask(category.task1).content) {
          taskRef = getTask(category.task1);
          expKey = 'task1';
        } else {
          taskRef = getTask(category.task0_6);
          expKey = 'task0_6';
        }
      }

      // Ensure we have a valid taskRef: if matched experience level has no content, fallback to any non-empty task in this category
      if (!taskRef || !taskRef.content || !taskRef.content.trim()) {
        const levels = ['task0_6', 'task1', 'task2', 'taskAbove2'];
        for (const lvl of levels) {
          const candidate = getTask(category[lvl]);
          if (candidate && candidate.content && candidate.content.trim()) {
            taskRef = candidate;
            expKey = lvl;
            break;
          }
        }
      }

      // If category still has no valid task content, fallback to any available Task from database
      if (!taskRef || !taskRef.content || !taskRef.content.trim()) {
        const anyTask = await Task.findOne({ content: { $exists: true, $ne: '' } }).sort({ createdAt: -1 });
        if (anyTask) {
          taskRef = getTask(anyTask);
          if (!expKey) expKey = 'task0_6';
        }
      }

      const taskContent = taskRef?.content || '';
      const taskLink    = taskRef?.taskLink || '';

      const host = request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const origin = `${proto}://${host}`;
      const basePath = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
      const baseURL = origin + basePath;

      // Check if there is an associated TaskForm for this Category & Experience
      let taskFormLink = '';
      if (expKey) {
        let matchingForm = await TaskForm.findOne({ jobCategory: categoryId, experience: expKey });
        if (!matchingForm) {
          matchingForm = await TaskForm.findOne({ jobCategory: categoryId });
        }
        if (matchingForm) {
          const categorySlug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          taskFormLink = `${baseURL}/submit-task/${categorySlug}?id=${application._id}`;
        }
      }

      // Check if automated email sending is enabled
      const smtpConfig = await SmtpConfig.findOne();
      isAutoEmailEnabled = smtpConfig ? smtpConfig.autoEmailEnabled !== false : true;

      if (!isAutoEmailEnabled) {
        console.log(`Automated email is DISABLED in SMTP settings. Skipping auto-email to: ${email}`);
      } else if (email) {
        if (taskContent && taskContent.trim()) {
          await sendTaskEmail({
            email,
            fullName,
            categoryName: category.name,
            taskContent,
            taskLink,
            taskFormLink,
            baseURL,
          });
          application.emailSent = true;
          application.lastEmailSentAt = new Date();
          application.lastEmailType = 'Interview Task';
          await application.save();
          console.log(`Successfully sent task email to ${email}`);
        } else {
          await sendThankYouEmail({
            email,
            fullName,
            categoryName: category.name,
            baseURL,
          });
          application.emailSent = true;
          application.lastEmailSentAt = new Date();
          application.lastEmailType = 'Thank You';
          await application.save();
          console.log(`Successfully sent general thank you email to ${email}`);
        }
      }
    } catch (mailError) {
      console.error('Failed to send email to candidate:', mailError);
    }

    const appData = application.toObject ? application.toObject() : application;
    return NextResponse.json({
      ...appData,
      isAutoEmailEnabled,
      emailSent: Boolean(application.emailSent),
      lastEmailType: application.lastEmailType || ''
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const expType = searchParams.get('expType') || '';
    const expYears = searchParams.get('expYears') || '';
    const location = searchParams.get('location') || '';
    const gradYear = searchParams.get('gradYear') || '';
    const workingStatus = searchParams.get('workingStatus') || '';
    const dynamicFiltersStr = searchParams.get('dynamicFilters');
    const minSalary = searchParams.get('minSalary') || '';
    const maxSalary = searchParams.get('maxSalary') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || '';

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    let query = { categoryId };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else if (status === 'New') {
        const newCond = [{ status: 'New' }, { status: { $exists: false } }, { status: '' }];
        if (query.$or) {
          query.$and = query.$and || [];
          query.$and.push({ $or: newCond });
        } else {
          query.$or = newCond;
        }
      } else if (status === 'Task Submitted') {
        query.status = { $regex: /^Task Submitted/i };
      } else if (status === 'Direct Interview') {
        query.status = { $regex: /^Direct Interview/i };
      } else if (status === 'Direct Interview Attended') {
        query.status = { $regex: /^Direct Interview Attended/i };
      } else if (status === 'Final Result') {
        query.status = { $regex: /^Final Result/i };
      } else if (status === 'Pending') {
        query.status = { $in: ['Pending', 'Direct Interview Attended - Not Attended'] };
      } else if (status === 'Rejected') {
        query.status = { $in: ['Rejected', 'Direct Interview - Not Selected', 'Final Result - Not Selected'] };
      } else {
        query.status = status;
      }
    }

    if (location) {
      query.$or = query.$or || [];
      query.$or.push(
        { 'staticData.currentChennaiLocation': { $regex: location, $options: 'i' } },
        { 'staticData.nativePlace': { $regex: location, $options: 'i' } }
      );
    }

    if (expType) {
      if (expType.toLowerCase() === 'fresher') {
        query['staticData.experience'] = { $regex: /^fresher$/i };
      } else if (expType.toLowerCase() === 'experienced') {
        query['staticData.experience'] = { $not: { $regex: /^fresher$/i } };
      }
    }

    if (expYears) {
      query['staticData.experience'] = { $regex: expYears, $options: 'i' };
    }

    if (gradYear) {
      query['staticData.gradYear'] = { $regex: gradYear, $options: 'i' };
    }

    if (workingStatus) {
      if (workingStatus.toLowerCase() === 'working') {
        query['staticData.workingCurrently'] = 'yes';
      } else if (workingStatus.toLowerCase() === 'not working') {
        query.$or = query.$or || [];
        query.$or.push(
          { 'staticData.workingCurrently': 'no' },
          { 'staticData.experience': { $regex: /^fresher$/i } },
          { 'staticData.workingCurrently': { $exists: false } }
        );
      }
    }

    if (dynamicFiltersStr) {
      try {
        const dynamicFilters = JSON.parse(dynamicFiltersStr);
        for (const [key, val] of Object.entries(dynamicFilters)) {
          if (val) {
            query[`dynamicData.${key}`] = { $regex: val, $options: 'i' };
          }
        }
      } catch (e) {
        console.error("Failed to parse dynamicFilters", e);
      }
    }

    if (minSalary || maxSalary) {
      query.$expr = { $and: [] };
      
      // Convert to double safely. If missing or null or non-numeric, default to 0.
      const salaryExpr = {
        $toDouble: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$staticData.currentSalary", null] },
                { $ne: ["$staticData.currentSalary", ""] }
              ]
            },
            then: "$staticData.currentSalary",
            else: "0"
          }
        }
      };

      if (minSalary) {
        query.$expr.$and.push({ $gte: [salaryExpr, Number(minSalary)] });
      }
      if (maxSalary) {
        query.$expr.$and.push({ $lte: [salaryExpr, Number(maxSalary)] });
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        let end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }

    const skip = (page - 1) * limit;

    const [applications, totalFilteredCount, totalCount, todayCount, monthCount] = await Promise.all([
      Application.find(query)
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
      Application.countDocuments({ categoryId }),
      Application.countDocuments({
        categoryId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      Application.countDocuments({
        categoryId,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        total: totalFilteredCount,
        page,
        limit,
        totalPages: Math.ceil(totalFilteredCount / limit)
      },
      stats: {
        total: totalCount,
        today: todayCount,
        month: monthCount
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDatabase();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Try to delete physical resume file
    if (application.resume) {
      await deleteFile(application.resume);
    }

    await Application.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Application ID and status are required' }, { status: 400 });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  }
}
