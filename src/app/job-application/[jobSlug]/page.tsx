import { connectToDatabase } from '../../../lib/mongoDb';
import Category from '../../../models/Category';
import Form from '../../../models/Form';
import { notFound } from 'next/navigation';
import ApplyFormClient from '../../job/[role]/apply/ApplyFormClient';

export default async function JobApplicationPage({ params }: { params: Promise<{ jobSlug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.jobSlug || '';

  let searchName = '';
  if (slug === 'frontend-job-application') {
    searchName = 'Frontend Developer';
  } else if (slug === 'php-job-application') {
    searchName = 'PHP Web Developer';
  } else if (slug === 'testing-job-application') {
    searchName = 'Software Tester';
  } else {
    return notFound();
  }

  await connectToDatabase();

  // Find the category and populate the linked form template
  const category = await Category.findOne({
    name: { $regex: new RegExp('^' + searchName + '$', 'i') }
  }).populate({ path: 'formId', model: Form }).lean();

  if (!category) {
    return notFound();
  }

  const formTemplate = category.formId || null;

  // Serialise to pass to client component
  const serializedCategory = JSON.parse(JSON.stringify(category));
  const serializedForm = formTemplate ? JSON.parse(JSON.stringify(formTemplate)) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <ApplyFormClient category={serializedCategory} formTemplate={serializedForm} />
    </div>
  );
}
