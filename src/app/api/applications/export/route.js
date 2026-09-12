import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Application from '../../../../models/Application';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search') || '';
    const expType = searchParams.get('expType') || '';
    const expYears = searchParams.get('expYears') || '';
    const location = searchParams.get('location') || '';
    const gradYear = searchParams.get('gradYear') || '';
    const workingStatus = searchParams.get('workingStatus') || '';
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

    if (expYears) query['staticData.experience'] = { $regex: expYears, $options: 'i' };
    if (gradYear) query['staticData.gradYear'] = { $regex: gradYear, $options: 'i' };
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

    if (minSalary || maxSalary) {
      query.$expr = { $and: [] };
      
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
      if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
    }

    // Fetch ALL matching applications — no pagination, exclude resume field
    const applications = await Application.find(query)
      .populate('categoryId', 'name')
      .select('-resume')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Export fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch export data' }, { status: 500 });
  }
}
