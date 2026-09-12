import Link from 'next/link';
import { connectToDatabase } from '../../../lib/mongoDb';
import Category from '../../../models/Category';
import Form from '../../../models/Form'; // Ensure Form model schema is registered in Mongoose
import { notFound, redirect } from 'next/navigation';

export default async function JobDetails({ params }: { params: Promise<{ role: string }> }) {
  const resolvedParams = await params;

  // Determine apply URL and override active status for special jobs
  const roleLower = (resolvedParams.role || '').toLowerCase();
  let applyUrl = `/job/${resolvedParams.role}/apply`;
  let isSpecialJob = false;

  if (roleLower === 'frontend-developer' || roleLower === 'front-end-developer') {
    applyUrl = '/job-application/frontend-job-application';
    isSpecialJob = true;
  } else if (roleLower === 'php-web-developer' || roleLower === 'php-developer' || roleLower === 'backend-php-developer') {
    applyUrl = '/job-application/php-job-application';
    isSpecialJob = true;
  } else if (roleLower === 'software-tester' || roleLower === 'software-testing' || roleLower === 'testing') {
    applyUrl = '/job-application/testing-job-application';
    isSpecialJob = true;
  }

  // Create regex from role slug to find category name (e.g., web-developer -> "Web Developer")
  const roleStr = resolvedParams.role || '';
  const searchName = roleStr.split('-').join(' ');

  await connectToDatabase();
  const category = await Category.findOne({
    name: { $regex: new RegExp('^' + searchName + '$', 'i') }
  }).populate('formId');

  if (!category) {
    return notFound();
  }

  const displayTitle = category.name;
  const initials = displayTitle.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="w-full flex flex-col items-center bg-gray-50 min-h-screen">
      {/* Premium Top Banner */}
      <div className="w-full bg-white border-b border-gray-100 pt-16 pb-24 px-8 flex flex-col items-center relative overflow-hidden">
        {/* Subtle background blob for premium aesthetic */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-50/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-y-1/2 -translate-x-1/3"></div>

        <div className="w-full max-w-6xl relative z-10">
          <div className="text-sm font-medium text-gray-400 mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-[#ff6600] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-800">{displayTitle}</span>

          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-[#ff7800] to-orange-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-orange-500/30 shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="material-symbols-outlined text-5xl">{category.icon || 'work'}</span>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-700 mb-4 tracking-tight">{displayTitle}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-sm font-bold tracking-wide shadow-sm border border-blue-100/50">Full-Time</span>
                <span className="bg-green-50 text-green-600 px-5 py-2 rounded-full text-sm font-bold tracking-wide shadow-sm border border-green-100/50">Tambaram West, Chennai</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl px-4 sm:px-8 -mt-10 relative z-20 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

        {/* Left Column: Details Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12">

          <h3 className="text-2xl text-gray-900 font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-1.5 bg-[#ff6600] rounded-full"></span>
            Job Description
          </h3>
          <p className="text-gray-600 mb-12 leading-relaxed text-lg whitespace-pre-line">
            {category.description}
          </p>

          <h3 className="text-2xl text-gray-900 font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-1.5 bg-[#ff6600] rounded-full"></span>
            Responsibilities
          </h3>
          <ul className="space-y-4">
            {category.responsibilities && category.responsibilities.length > 0 ? category.responsibilities.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-4 text-gray-600 text-lg leading-relaxed">
                <div className="w-6 h-6 mt-1 rounded-full bg-orange-50 flex items-center justify-center text-[#ff6600] shrink-0 shadow-sm border border-orange-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>{item}</span>
              </li>
            )) : (
              <li className="text-gray-500">No responsibilities listed.</li>
            )}
          </ul>
        </div>

        {/* Right Column: Overview Card */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 p-8">
            <h3 className="text-2xl text-gray-900 font-bold mb-8">Job Overview</h3>

            <div className="space-y-6 mb-10">

              <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ff6600] shadow-inner shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium tracking-wide">LOCATION</p>
                  <p className="text-gray-900 font-bold">Tambaram West, Chennai</p>
                </div>
              </div>

              <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium tracking-wide">JOB TITLE</p>
                  <p className="text-gray-900 font-bold">{displayTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium tracking-wide">WORKING HOURS</p>
                  <p className="text-gray-900 font-bold">48h / week</p>
                </div>
              </div>

            </div>

            {category.isActive || isSpecialJob ? (
              <Link href={applyUrl} className="w-full bg-gradient-to-r from-[#ff7800] to-orange-500 hover:from-orange-600 hover:to-[#ff7800] text-white py-5 px-6 font-bold text-lg rounded-full shadow-lg hover:shadow-orange-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                Apply For This Job
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            ) : (
              <button disabled className="w-full bg-gray-300 text-gray-500 py-5 px-6 font-bold text-lg rounded-full cursor-not-allowed flex items-center justify-center gap-3 shadow-inner">
                Closed / Inactive
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
