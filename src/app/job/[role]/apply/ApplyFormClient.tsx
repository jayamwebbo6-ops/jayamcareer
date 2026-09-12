
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';

export default function ApplyFormClient({ category, formTemplate }: { category: any, formTemplate: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState<any>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Stepper State Calculation
  const [currentStep, setCurrentStep] = useState(0);
  const customSections = formTemplate?.customSections || [];

  // Fresher logic: if experience is 0-6
  const isFresher = formData.experience === '0-6';

  // Build the steps array (Professional step is always shown, but customized internally)
  const steps = [
    { id: 'personal', title: 'Personal Information' },
    { id: 'professional', title: 'Professional & Technical Information' },
    ...customSections.map((section: any, idx: number) => ({
      id: `custom-${section.id || idx}`,
      title: section.heading,
      isCustom: true,
      customIndex: idx,
      sectionData: section
    })),
    { id: 'compensation', title: 'Compensation & Availability' }
  ];

  const totalSteps = steps.length;

  const handleStaticChange = (e: any) => {
    const { name, value } = e.target;

    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };

      // If experience selection changes, clean up experience-dependent values
      if (name === 'experience') {
        // Clear internshipDone if they are not a Fresher anymore
        if (value !== '0-6') {
          delete updated.internshipDone;
        }
      }

      return updated;
    });
  };

  const handleDynamicChange = (questionId: string, value: string | boolean | string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      dynamicFields: {
        ...(prev.dynamicFields || {}),
        [questionId]: value
      }
    }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setFormData((prev: any) => {
      const current = prev.dynamicFields?.[questionId] || [];
      if (checked) {
        return { ...prev, dynamicFields: { ...prev.dynamicFields, [questionId]: [...current, option] } };
      } else {
        return { ...prev, dynamicFields: { ...prev.dynamicFields, [questionId]: current.filter((item: string) => item !== option) } };
      }
    });
  };

  const handleNext = (e: any) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (form) {
      if (form.checkValidity()) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        form.reportValidity();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please upload your resume.');
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      alert('Your resume file is too large. Please upload a file smaller than 5MB.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      // Prepare static data copy and resolve 'Other' degree into actual value
      const staticData = { ...(formData || {}) };
      if (staticData.degree === 'Other' && staticData.otherDegree) {
        staticData.degree = staticData.otherDegree;
        delete staticData.otherDegree;
      }

      submitData.append('categoryId', category._id);
      submitData.append('fullName', staticData.fullName || formData.fullName || '');
      submitData.append('email', staticData.email || formData.email || '');
      submitData.append('mobile', staticData.mobile || formData.mobile || '');
      submitData.append('staticData', JSON.stringify(staticData));
      submitData.append('dynamicData', JSON.stringify(formData.dynamicFields || {}));
      submitData.append('resume', resumeFile);

      const res = await api.post('/api/applications', submitData);

      if (res.status !== 201 && res.status !== 200) {
        throw new Error('Submission failed');
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find step IDs for clean visibility rendering
  const activeStepConfig = steps[currentStep] || { id: '' };

  if (isSuccess) {
    const whatsappText = encodeURIComponent(`Hi, I have completed the interview task for ${category.name}. My name is ${formData.fullName || ''} and phone number is ${formData.mobile || ''}.`);

    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border-4 border-green-100">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 text-center font-bold">Application Submitted Successfully!</h2>

          {category.isActive ? (
            <>
              <div className="bg-orange-50/60 rounded-2xl border border-orange-100/80 p-6 text-center mb-8 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
                <p className="text-sm font-bold text-orange-800 mb-1">📬 Interview Task Sent!</p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  We have sent the remote interview task instructions directly to your email address: <strong className="text-orange-950">{formData.email || 'your registered email'}</strong>.
                </p>
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  Please check your inbox (and spam folder) to complete it.
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-8 max-w-md leading-relaxed">
                Thank you for applying for the <strong className="text-gray-900">{category.name}</strong> position. Once you finish the task, please submit it as per the email instructions.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600 mb-8 max-w-md leading-relaxed">
              We have successfully received your application for the <strong className="text-gray-900">{category.name}</strong> position. Our team will review your application and contact you soon.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">

            <Link href="/" className="bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md text-center text-sm flex items-center justify-center">
              Back to Careers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href={`/job/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} className="text-[#ff6600] font-bold hover:underline mb-4 inline-block">
          &larr; Back to Job Details
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Application Form</h1>
        <p className="text-gray-500 mt-2">Applying for: <strong className="text-gray-900">{category.name}</strong></p>
      </div>


      {/* Stepper Progress Bar */}
      <div className="mb-8 mt-4 relative px-2 sm:px-4">
        {/* Background connector line */}
        <div className="absolute top-[18px] sm:top-[24px] left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0 mx-6 sm:mx-8"></div>
        {/* Active connector line */}
        <div
          className="absolute top-[18px] sm:top-[24px] left-0 h-0.5 bg-gradient-to-r from-orange-500 to-[#ff6600] -translate-y-1/2 z-0 mx-6 sm:mx-8 transition-all duration-500"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        ></div>

        <div className="relative z-10 flex justify-between items-start">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            // Pick icon dynamically
            let stepIcon = (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            );

            if (step.id === 'personal') {
              stepIcon = (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              );
            } else if (step.id === 'professional') {
              stepIcon = (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              );
            } else if (step.id === 'compensation') {
              stepIcon = (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              );
            } else if (step.isCustom) {
              stepIcon = (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              );
            }

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Circle Container */}
                <div
                  className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                      ? 'bg-gradient-to-r from-orange-500 to-[#ff6600] border-[#ff6600] text-white shadow-md shadow-orange-500/20'
                      : isActive
                        ? 'bg-white border-[#ff6600] text-[#ff6600] ring-4 ring-orange-100 shadow-md scale-110 z-10'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                >
                  {isCompleted ? (
                    <svg className="w-4.5 h-4.5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : stepIcon}
                </div>
                {/* Step Text Label (Hidden on mobile to avoid clutter/overlap) */}
                <span className={`hidden sm:block text-[10px] sm:text-xs font-bold mt-3 text-center px-1 max-w-[110px] transition-colors duration-300 leading-tight ${isActive ? 'text-[#ff6600]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Futuristic single-active step description for mobile screens */}
        <div className="text-center mt-6 sm:hidden bg-orange-50/60 rounded-xl p-3 border border-orange-100 animate-in fade-in duration-300">
          <p className="text-[10px] text-orange-600 font-extrabold uppercase tracking-widest">Step {currentStep + 1} of {totalSteps}</p>
          <h4 className="text-xs font-extrabold text-orange-950 mt-0.5 uppercase tracking-wider">{steps[currentStep]?.title}</h4>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Step 1: Personal Information */}
        <div className={activeStepConfig.id === 'personal' ? "bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in duration-300" : "hidden"}>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-6 h-1.5 bg-[#ff6600] rounded-full inline-block"></span>
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name *</label>
              <input type="text" name="fullName" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                pattern="[0-9]{10}"
                maxLength={10}
                minLength={10}
                placeholder="10-digit mobile number"
                title="Please enter a valid 10-digit mobile number."
                required={activeStepConfig.id === 'personal'}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '');
                  handleStaticChange(e);
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email ID *</label>
              <input
                type="email"
                name="email"
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                title="Please enter a valid email address."
                placeholder="email@example.com"
                required={activeStepConfig.id === 'personal'}
                onChange={handleStaticChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Native Place *</label>
              <input type="text" name="nativePlace" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Are you currently based in Chennai? *</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="basedInChennai" value="yes" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Yes</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="basedInChennai" value="no" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> No</label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Are you available to join within a week? *</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="joinWithinWeek" value="yes" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Yes</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="joinWithinWeek" value="no" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> No</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Marital Status *</label>
              <select name="maritalStatus" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all text-gray-900 text-sm">
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Date of Birth *</label>
              <input type="date" name="dob" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Total Work Experience *</label>
              <select
                name="experience"
                value={formData.experience || ''}
                required={activeStepConfig.id === 'personal'}
                onChange={handleStaticChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all text-gray-900 text-sm"
              >
                <option value="">Select Experience Range</option>
                <option value="0-6">0-6 Months</option>
                <option value="6-1">6 Months - 1 Year</option>
                <option value="1-2">1-2 Years</option>
                <option value="2+">2+ Years</option>
              </select>
            </div>

            {/* Conditional Internship Question for Freshers */}
            {isFresher && (
              <div className="md:col-span-2 bg-orange-50/50 p-5 rounded-xl border border-orange-100 animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-gray-700 mb-2">Have you done any Internship? *</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="internshipDone"
                      value="yes"
                      required={activeStepConfig.id === 'personal' && isFresher}
                      onChange={handleStaticChange}
                      className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]"
                    /> Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="internshipDone"
                      value="no"
                      required={activeStepConfig.id === 'personal' && isFresher}
                      onChange={handleStaticChange}
                      className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]"
                    /> No
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Degree *</label>
              <select name="degree" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all text-gray-900 text-sm">
                <option value="">Select Degree</option>
                <option value="B.E/B.Tech">B.E/B.Tech</option>
                <option value="B.Sc">B.Sc</option>
                <option value="BCA">BCA</option>
                <option value="M.E/M.Tech">M.E/M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.degree === 'Other' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Please specify your Degree *</label>
                <input
                  type="text"
                  name="otherDegree"
                  required={activeStepConfig.id === 'personal'}
                  onChange={handleStaticChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all"
                  placeholder="Enter your degree"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Specialization / Major *</label>
              <input type="text" name="specialization" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all" placeholder="e.g., Computer Science, Marketing" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">University / College *</label>
              <input type="text" name="university" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all" placeholder="e.g., Anna University" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Graduation Year *</label>
              <select name="gradYear" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all text-gray-900 text-sm">
                <option value="">Select Year</option>
                {[2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Do you have any career gap? *</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="careerGap" value="yes" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Yes</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="careerGap" value="no" required={activeStepConfig.id === 'personal'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> No</label>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Professional & Technical Information */}
        <div className={activeStepConfig.id === 'professional' ? "bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in duration-300" : "hidden"}>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-6 h-1.5 bg-[#ff6600] rounded-full inline-block"></span>
            Professional & Technical Information
          </h3>

          {/* Current Employment Status: Hide if Fresher */}
          {!isFresher && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Current Employment Status</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Are you working currently? *</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="workingCurrently" value="yes" required={activeStepConfig.id === 'professional' && !isFresher} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Yes</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="workingCurrently" value="no" required={activeStepConfig.id === 'professional' && !isFresher} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> No</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Are you serving notice period? *</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="servingNotice" value="yes" required={activeStepConfig.id === 'professional' && !isFresher} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Yes</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="servingNotice" value="no" required={activeStepConfig.id === 'professional' && !isFresher} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> No</label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">If you are selected you are requested to give a copy of the last 3 months bank statement as Salary Proof. Will you be able to submit the last 3 months bank statement? *</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="canSubmitBankStatement" value="yes" required={activeStepConfig.id === 'professional' && !isFresher} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Yes</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="canSubmitBankStatement" value="no" required={activeStepConfig.id === 'professional' && !isFresher} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> No</label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Reason for Job Change (optional)</label>
                  <textarea name="reasonForChange" onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all h-24"></textarea>
                </div>
              </div>
            </>
          )}

          {/* Project Experience: Display for both Fresher and Experienced */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Project Experience</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Have you worked on client projects? *</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="clientProjects" value="yes" required={activeStepConfig.id === 'professional'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Yes</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="clientProjects" value="no" required={activeStepConfig.id === 'professional'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> No</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Do you prefer to work independently or in a team? *</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="workPreference" value="Independently" required={activeStepConfig.id === 'professional'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Independently</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="workPreference" value="Team" required={activeStepConfig.id === 'professional'} onChange={handleStaticChange} className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]" /> Team</label>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Dynamic Sections Loop */}
        {customSections.map((section: any, sectionIndex: number) => {
          // Find if this step is currently active
          const stepConfig = steps.find(s => s.isCustom && s.customIndex === sectionIndex);
          const isActive = stepConfig && activeStepConfig.id === stepConfig.id;

          return (
            <div key={section.id} className={isActive ? "bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in duration-300" : "hidden"}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-6 h-1.5 bg-[#ff6600] rounded-full inline-block"></span>
                {section.heading}
              </h3>

              <div className="space-y-6">
                {section.questions.map((question: any) => (
                  <div key={question.id}>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {question.text} {question.required && <span className="text-red-500">*</span>}
                    </label>

                    {question.type === 'text' && (
                      <input
                        type="text"
                        required={question.required && isActive}
                        onChange={(e) => handleDynamicChange(question.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all"
                        placeholder="Your answer"
                      />
                    )}

                    {question.type === 'radio' && (
                      <div className="flex flex-col gap-3 mt-2">
                        {question.options.map((opt: string, i: number) => (
                          <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name={question.id}
                              value={opt}
                              required={question.required && isActive}
                              onChange={(e) => handleDynamicChange(question.id, e.target.value)}
                              className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600]"
                            />
                            <span className="text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'checkbox' && (
                      <div className="flex flex-col gap-3 mt-2">
                        {question.options.map((opt: string, i: number) => (
                          <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              value={opt}
                              onChange={(e) => handleCheckboxChange(question.id, opt, e.target.checked)}
                              className="w-4 h-4 text-[#ff6600] focus:ring-[#ff6600] rounded"
                            />
                            <span className="text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Step 4: Compensation & Availability */}
        <div className={activeStepConfig.id === 'compensation' ? "bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in duration-300" : "hidden"}>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-6 h-1.5 bg-[#ff6600] rounded-full inline-block"></span>
            Compensation & Availability
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {!isFresher && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">What's the monthly salary amount credited in your bank account *</label>
                  <input type="text" name="currentSalary" required={activeStepConfig.id === 'compensation' && !isFresher} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Notice Period *</label>
                  <select name="noticePeriod" required={activeStepConfig.id === 'compensation' && !isFresher} onChange={handleStaticChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all text-gray-900 text-sm">
                    <option value="">Select</option>
                    <option value="Immediate">Immediate</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="2 months">2 months</option>
                    <option value="Serving">Serving</option>
                  </select>
                </div>
              </>
            )}

            <div className={isFresher ? "md:col-span-2 animate-in fade-in duration-300" : ""}>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Upload Your Resume (PDF/DOC) *</label>
              <label className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 text-center text-sm font-bold text-gray-600 bg-gray-50 flex items-center justify-center gap-3 cursor-pointer transition-colors group h-12">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="truncate max-w-[200px]">{resumeFile ? resumeFile.name : 'Click to select file'}</span>
                <input type="file" required={activeStepConfig.id === 'compensation' && !resumeFile} onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="hidden" accept=".pdf,.doc,.docx" />
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Bar at the Bottom */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-100 gap-4">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer flex items-center gap-2 active:scale-95 duration-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
          ) : (
            <div></div> // Placeholder to align next button on the right
          )}

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-[#ff6600] hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-orange-500/20 flex items-center gap-2 active:scale-95 duration-100 cursor-pointer"
            >
              Next Step
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-gradient-to-r from-[#ff7800] to-orange-500 hover:from-orange-600 hover:to-[#ff7800] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'transform hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
              {!isSubmitting && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
