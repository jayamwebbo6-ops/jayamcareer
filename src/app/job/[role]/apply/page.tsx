import { connectToDatabase } from '../../../../lib/mongoDb';
import Category from '../../../../models/Category';
import Form from '../../../../models/Form';
import { notFound, redirect } from 'next/navigation';
import ApplyFormClient from './ApplyFormClient';

export default async function ApplyPage({ params }: { params: Promise<{ role: string }> }) {
  const resolvedParams = await params;

  // Redirect specific jobs directly to external apply forms
  const roleLower = (resolvedParams.role || '').toLowerCase();
  if (roleLower === 'frontend-developer' || roleLower === 'front-end-developer') {
    redirect('https://careeratjayamwebsolutions.com/job-application/frontend-job-application');
  }
  if (roleLower === 'php-web-developer' || roleLower === 'php-developer' || roleLower === 'backend-php-developer') {
    redirect('https://careeratjayamwebsolutions.com/job-application/php-job-application');
  }
  if (roleLower === 'software-tester' || roleLower === 'software-testing' || roleLower === 'testing') {
    redirect('https://careeratjayamwebsolutions.com/job-application/testing-job-application');
  }

  const roleStr = resolvedParams.role || '';
  const searchName = roleStr.split('-').join(' ');

  await connectToDatabase();

  // Find the category and populate the linked form template
  const category = await Category.findOne({
    name: { $regex: new RegExp('^' + searchName + '$', 'i') }
  }).populate({ path: 'formId', model: Form }).lean();

  if (!category || !category.isActive) {
    return notFound();
  }

  const formTemplate = category.formId || null;

  // Need to stringify/parse to pass objects with ObjectIds to client components
  const serializedCategory = JSON.parse(JSON.stringify(category));
  const serializedForm = formTemplate ? JSON.parse(JSON.stringify(formTemplate)) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <ApplyFormClient category={serializedCategory} formTemplate={serializedForm} />
    </div>
  );
}
