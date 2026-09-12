'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'checkbox' | 'radio' | 'select';
  required: boolean;
  options: string[];
}

interface Section {
  id: string;
  heading: string;
  questions: Question[];
}

interface TaskForm {
  name: string;
  customSections: Section[];
}

function SubmitTaskContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formDetails, setFormDetails] = useState<{
    form: TaskForm;
    candidateName: string;
    categoryName: string;
  } | null>(null);

  // Local state for candidate answers
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setError('Invalid submission URL. Missing application ID.');
      setLoading(false);
      return;
    }

    const loadForm = async () => {
      try {
        const response = await api.get(`/api/task-submissions?applicationId=${applicationId}`);
        if (response.data.success) {
          setFormDetails(response.data.data);
          
          // Pre-populate empty answers state
          const initialAnswers: Record<string, any> = {};
          response.data.data.form.customSections.forEach((sec: Section) => {
            sec.questions.forEach((q: Question) => {
              initialAnswers[q.id] = q.type === 'checkbox' ? [] : '';
            });
          });
          setAnswers(initialAnswers);
        } else {
          setError(response.data.message || 'Failed to load task form.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch the assigned interview task form.');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [applicationId]);

  const handleInputChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: string, option: string, isChecked: boolean) => {
    setAnswers(prev => {
      const currentList = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const updatedList = isChecked 
        ? [...currentList, option] 
        : currentList.filter((item: string) => item !== option);
      return { ...prev, [questionId]: updatedList };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDetails || !applicationId) return;

    // Validate required questions programmatically
    let firstInvalidQuestionId: string | null = null;
    let missingQuestionText = "";
    let missingSectionHeading = "";

    for (const section of formDetails.form.customSections) {
      for (const q of section.questions) {
        if (q.required) {
          const val = answers[q.id];
          let isInvalid = false;
          if (q.type === 'checkbox') {
            if (!Array.isArray(val) || val.length === 0) {
              isInvalid = true;
            }
          } else {
            if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
              isInvalid = true;
            }
          }
          if (isInvalid) {
            if (!firstInvalidQuestionId) {
              firstInvalidQuestionId = q.id;
              missingQuestionText = q.text;
              missingSectionHeading = section.heading;
            }
          }
        }
      }
    }

    if (firstInvalidQuestionId) {
      setShowValidationErrors(true);
      setValidationErrorMessage(`Please answer the required question: "${missingQuestionText}" in section "${missingSectionHeading}"`);
      
      const element = document.getElementById(`q-container-${firstInvalidQuestionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setShowValidationErrors(false);
    setValidationErrorMessage(null);

    // Map index-based selections back to actual option text strings for the backend
    const mappedAnswers: Record<string, any> = {};
    formDetails.form.customSections.forEach((section) => {
      section.questions.forEach((q) => {
        const val = answers[q.id];
        if (q.type === 'radio') {
          const idx = parseInt(val);
          mappedAnswers[q.id] = (!isNaN(idx) && q.options[idx]) ? q.options[idx] : val;
        } else if (q.type === 'checkbox') {
          const indices = Array.isArray(val) ? val : [];
          mappedAnswers[q.id] = indices.map(idxStr => q.options[parseInt(idxStr)]).filter(Boolean);
        } else {
          mappedAnswers[q.id] = val;
        }
      });
    });

    try {
      setSubmitting(true);
      const response = await api.post(`/api/task-submissions/submit?id=${applicationId}`, { answers: mappedAnswers });
      if (response.data.success) {
        setIsSubmitted(true);
      } else {
        alert(response.data.message || 'Failed to submit task responses.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'An error occurred while submitting your task responses.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">Loading your interview task form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Form Access Error</h3>
          <p className="text-gray-500 mb-6 leading-relaxed">{error}</p>
          <p className="text-xs text-gray-400 font-medium">Please contact Jayam Web Solutions support if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  if (!formDetails) return null;

  const { form, candidateName, categoryName } = formDetails;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 animate-in fade-in zoom-in-95 duration-350">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">Task Submitted!</h3>
          <p className="text-gray-500 mb-6 leading-relaxed text-sm font-semibold">
            Thank you, {candidateName}. Your remote task answers have been registered and saved successfully. Our team will evaluate your response shortly.
          </p>
          <p className="text-xs text-gray-400 font-bold tracking-wide uppercase">Jayam Web Solutions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-4 sm:py-12 px-2 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Block */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-8 mb-4 sm:mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-[#ff6600]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            {form.name}
          </h1>
          <p className="text-gray-500 text-sm font-semibold tracking-wide uppercase mt-1 mb-4">
            Interview Process: {categoryName}
          </p>
         
        </div>

        {/* Dynamic Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-8">
          {form.customSections.map((section) => (
            <div key={section.id} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-8">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-1.5 h-6 bg-[#ff6600] rounded-full inline-block" />
                {section.heading}
              </h2>

              <div className="space-y-6">
                {section.questions.map((q) => {
                  const val = answers[q.id];
                  const hasError = showValidationErrors && q.required && (
                    q.type === 'checkbox'
                      ? (!Array.isArray(val) || val.length === 0)
                      : (val === undefined || val === null || (typeof val === 'string' && val.trim() === ''))
                  );

                  return (
                    <div
                      id={`q-container-${q.id}`}
                      key={q.id}
                      className={`space-y-2 p-4 -mx-4 sm:p-5 sm:-mx-5 rounded-2xl border transition-all duration-300 ${
                        hasError
                          ? 'border-red-200 bg-red-50/20'
                          : 'border-transparent bg-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-gray-800">
                          {q.text} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        {hasError && (
                          <span className="text-[10px] text-red-500 font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            ⚠️ Required
                          </span>
                        )}
                      </div>

                      {/* Question Input rendering by type */}
                      {q.type === 'text' && (
                        <input
                          type="text"
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white font-medium text-gray-900 text-sm ${
                            hasError
                              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                              : 'border-gray-200 focus:ring-[#ff6600]/20 focus:border-[#ff6600]'
                          }`}
                          placeholder="Type your answer here..."
                        />
                      )}

                    {q.type === 'select' && (
                      <select
                        required={q.required}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white font-medium text-gray-900 text-sm"
                      >
                        <option value="">-- Choose One Option --</option>
                        {q.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {q.type === 'radio' && (
                      <div className="space-y-2.5 pt-1.5">
                        {q.options.map((opt, i) => (
                          <label key={i} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name={q.id}
                              required={q.required && !answers[q.id]}
                              checked={answers[q.id] === i.toString()}
                              onChange={() => handleInputChange(q.id, i.toString())}
                              className="w-4 h-4 mt-0.5 rounded-full border-gray-300 text-[#ff6600] focus:ring-[#ff6600] accent-[#ff6600]"
                            />
                            <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'checkbox' && (
                      <div className="space-y-2.5 pt-1.5">
                        {q.options.map((opt, i) => {
                          const isChecked = (answers[q.id] || []).includes(i.toString());
                          return (
                            <label key={i} className="flex items-start gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(q.id, i.toString(), e.target.checked)}
                                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#ff6600] focus:ring-[#ff6600] accent-[#ff6600]"
                              />
                              <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                                {opt}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Error Banner */}
          {validationErrorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-red-800">Submission Blocked</p>
                <p className="text-xs text-red-700 mt-1 font-semibold">{validationErrorMessage}</p>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto bg-gradient-to-r from-orange-500 to-[#ff6600] hover:from-[#ff6600] hover:to-orange-600 text-white font-bold py-3.5 px-8 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transform active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting Task...
                </>
              ) : (
                <>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Task Response
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubmitTaskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">Loading...</p>
        </div>
      </div>
    }>
      <SubmitTaskContent />
    </Suspense>
  );
}
