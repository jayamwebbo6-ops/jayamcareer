'use client';

import { useState, useEffect } from 'react';
import api, { fetchAllCategories, fetchApplications } from '../../../lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const getFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Dynamically detect base path from browser window if running in client
  let dynamicBasePath = '';
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const adminIndex = pathname.indexOf('/jayam-admin');
    if (adminIndex !== -1) {
      dynamicBasePath = pathname.substring(0, adminIndex);
    }
  }
  
  const resolvedBasePath = dynamicBasePath || process.env.NEXT_PUBLIC_BASE_URL || '';
  
  if (resolvedBasePath && path.startsWith(resolvedBasePath)) return path;
  return `${resolvedBasePath}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function CompletedTasksPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewApp, setViewApp] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [evalTaskForm, setEvalTaskForm] = useState<any>(null);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [isLoadingEvalForm, setIsLoadingEvalForm] = useState(false);

  const [dateFilterType, setDateFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customRange, setCustomRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = customRange;

  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchAllCategories();
        const categoriesData = response.data || response;
        setCategories(categoriesData);
        if (categoriesData && categoriesData.length > 0) {
          setActiveCategoryId(categoriesData[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch applications with status 'Task Submitted - Submitted'
  useEffect(() => {
    if (!activeCategoryId) return;

    const loadApplications = async () => {
      setLoading(true);
      try {
        const data = await fetchApplications({
          categoryId: activeCategoryId,
          page: 1,
          limit: 100, // retrieve all submissions for this active page view
          status: 'Task Submitted - Submitted',
          search: '',
          expType: '',
          expYears: '',
          location: '',
          gradYear: '',
          workingStatus: '',
          jsFramework: '',
          minSalary: '',
          maxSalary: '',
          startDate: '',
          endDate: ''
        });
        setApplications(data.applications || []);
      } catch (err) {
        console.error('Failed to load completed tasks', err);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, [activeCategoryId, refreshKey]);

  // Load associated task form details when viewing application
  useEffect(() => {
    if (viewApp && viewApp.taskAnswers) {
      const loadEvalTaskForm = async () => {
        try {
          setIsLoadingEvalForm(true);
          const response = await api.get(`/api/task-submissions?applicationId=${viewApp._id}`);
          if (response.data.success) {
            setEvalTaskForm(response.data.data.form);
            setEvalScores(viewApp.taskScores || {});
          }
        } catch (error) {
          console.error("Failed to load task form details for evaluation:", error);
        } finally {
          setIsLoadingEvalForm(false);
        }
      };
      loadEvalTaskForm();
    } else {
      setEvalTaskForm(null);
      setEvalScores({});
    }
  }, [viewApp]);

  const handleSaveEvaluation = async () => {
    if (!viewApp || !evalTaskForm) return;

    let totalScore = 0;
    Object.values(evalScores).forEach(val => {
      totalScore += Number(val) || 0;
    });

    try {
      setIsSavingEval(true);
      const response = await api.put(`/api/admin/applications/${viewApp._id}/evaluate`, {
        taskScores: evalScores,
        taskTotalScore: totalScore
      });

      if (response.data.success) {
        alert("Evaluation saved successfully!");
        setViewApp((prev: any) => ({
          ...prev,
          taskScores: evalScores,
          taskTotalScore: totalScore,
          taskEvaluated: true
        }));
        setRefreshKey(prev => prev + 1);
      } else {
        alert(response.data.message || "Failed to save evaluation.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to save evaluation.");
    } finally {
      setIsSavingEval(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const submitDate = new Date(app.taskSubmittedAt || app.updatedAt);
    const now = new Date();

    // Date Filters
    let passDate = true;
    if (dateFilterType === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      passDate = submitDate >= todayStart;
    } else if (dateFilterType === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      passDate = submitDate >= weekStart;
    } else if (dateFilterType === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      passDate = submitDate >= monthStart;
    } else if (dateFilterType === 'custom') {
      const [start, end] = customRange;
      if (start && end) {
        const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
        passDate = submitDate >= start && submitDate <= endOfDay;
      } else if (start) {
        passDate = submitDate >= start;
      }
    }

    if (!passDate) return false;

    // Score Filters
    if (minScore !== '') {
      const min = parseFloat(minScore);
      if (!isNaN(min) && (app.taskTotalScore === undefined || app.taskTotalScore < min)) {
        return false;
      }
    }
    if (maxScore !== '') {
      const max = parseFloat(maxScore);
      if (!isNaN(max) && (app.taskTotalScore === undefined || app.taskTotalScore > max)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-[#ff6600]" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Completed Tasks</h1>
          <p className="text-gray-500 text-xs font-semibold mt-1 uppercase tracking-wider">Evaluate candidate remote task submissions</p>
        </div>
      </div>

      {/* Categories Tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/50">
          {categories.map((cat) => {
            const isActive = activeCategoryId === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => {
                  setActiveCategoryId(cat._id);
                  setViewApp(null);
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-[#ff6600] shadow-md shadow-[#ff6600]/5 scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Date & Score Filters UI Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Filter Selection */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'custom'] as const).map((type) => {
              const labelMap = {
                today: 'Today',
                week: 'This Week',
                month: 'This Month',
                custom: 'Custom Range'
              };
              return (
                <button
                  key={type}
                  onClick={() => setDateFilterType(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                    dateFilterType === type
                      ? 'bg-orange-50 border-orange-200 text-[#ff6600] shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {labelMap[type]}
                </button>
              );
            })}
          </div>

          {dateFilterType === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
              <DatePicker
                selected={startDate}
                onChange={(update: [Date | null, Date | null]) => setCustomRange(update)}
                startDate={startDate || undefined}
                endDate={endDate || undefined}
                selectsRange
                isClearable
                placeholderText="Select date range"
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff6600] w-52 text-gray-700 bg-white"
              />
            </div>
          )}
        </div>

        {/* Score Filter Inputs */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score:</span>
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-16 px-2.5 py-2 text-xs font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff6600] text-center text-gray-700 placeholder-gray-300"
            />
            <span className="text-gray-300 font-bold">—</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="w-16 px-2.5 py-2 text-xs font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-[#ff6600] text-center text-gray-700 placeholder-gray-300"
            />
          </div>
          {(minScore !== '' || maxScore !== '') && (
            <button
              onClick={() => {
                setMinScore('');
                setMaxScore('');
              }}
              className="text-xs text-gray-400 hover:text-red-500 font-bold px-1 py-1"
              title="Clear score filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main content table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 font-bold tracking-wide uppercase animate-pulse">Loading Submissions...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">No Task Submissions Found</h3>
            <p className="text-gray-400 text-sm max-w-sm mt-1">There are currently no candidates who submitted their task in this time period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Candidate Details</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Submitted Date</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Score</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{app.fullName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{app.email} • {app.mobile}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                      {new Date(app.taskSubmittedAt || app.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      <span className="text-xs text-gray-400 block mt-0.5">{new Date(app.taskSubmittedAt || app.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-sm text-gray-700">
                      {app.taskTotalScore !== undefined ? (
                        <span className="text-[#ff6600] font-black">{app.taskTotalScore}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Unscored</span>
                      )}
                      {app.taskMaxScore !== undefined && ` / ${app.taskMaxScore}`}
                    </td>
                    <td className="py-4 px-6">
                      {app.taskEvaluated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                          ● Evaluated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                          ● Pending Evaluation
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setViewApp(app)}
                        className="bg-gradient-to-r from-orange-500 to-[#ff6600] hover:from-[#ff6600] hover:to-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-500/10 transition-all active:scale-[0.98]"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Evaluation Modal Overlay */}
      {viewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewApp.fullName}'s Task Submission</h2>
                <p className="text-sm text-gray-500">{viewApp.email} • {viewApp.mobile}</p>
              </div>
              <button
                onClick={() => setViewApp(null)}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {viewApp.taskAnswers && (
                <>
                  {isLoadingEvalForm ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : evalTaskForm ? (
                    <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-150">
                      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-sm">{evalTaskForm.name}</h4>
                          <span className="text-xs text-gray-400 font-bold tracking-wider uppercase">Auto-Graded Task Submission</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 font-bold block">TOTAL SCORE</span>
                          <span className="text-lg font-black text-[#ff6600]">
                            {Object.values(evalScores).reduce((acc, curr) => acc + (Number(curr) || 0), 0).toFixed(1)} / {evalTaskForm.customSections.reduce((acc: number, sec: any) => acc + sec.questions.reduce((qAcc: number, q: any) => qAcc + (Number(q.marks) || 1), 0), 0)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {evalTaskForm.customSections.map((section: any) => (
                          <div key={section.id} className="space-y-3">
                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-wide border-l-2 border-[#ff6600] pl-2">{section.heading}</h5>
                            <div className="space-y-3 pl-3">
                              {section.questions.map((q: any) => {
                                const answer = viewApp.taskAnswers[q.id];
                                return (
                                  <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-start gap-2">
                                        <span className="text-sm font-bold text-gray-800">{q.text}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide">Max: {q.marks || 1}</span>
                                      </div>

                                      <div className="text-xs">
                                        <span className="text-gray-400 font-bold">Candidate Answer: </span>
                                        <span className="font-semibold text-gray-700">
                                          {Array.isArray(answer)
                                            ? (answer.length > 0 ? answer.join(', ') : <span className="italic text-gray-400">None checked</span>)
                                            : (answer || <span className="italic text-gray-400">No input provided</span>)
                                          }
                                        </span>
                                      </div>

                                      {(q.type === 'radio' || q.type === 'checkbox') && q.options && q.options.length > 0 && (
                                        <div className="text-xs">
                                          <span className="text-emerald-500 font-bold">Option Marks: </span>
                                          <span className="font-semibold text-emerald-600">
                                            {q.options.map((opt: string, idx: number) => {
                                              const mark = (q.optionMarks && q.optionMarks[idx] !== undefined) ? q.optionMarks[idx] : 0;
                                              return mark > 0 ? `${opt} (${mark} pts)` : null;
                                            }).filter(Boolean).join(', ') || 'No positive points defined'}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="w-full md:w-32 flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                                      <label className="text-xs font-bold text-gray-500 uppercase">Score:</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={q.marks || 1}
                                        step={0.1}
                                        value={evalScores[q.id] !== undefined ? evalScores[q.id] : 0}
                                        onChange={(e) => setEvalScores({ ...evalScores, [q.id]: Math.min(Number(q.marks) || 1, Math.max(0, Number(e.target.value))) })}
                                        className="w-16 px-2 py-1 rounded border border-gray-200 text-center font-bold text-[#ff6600] focus:ring-1 focus:ring-[#ff6600] focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                        <button
                          onClick={handleSaveEvaluation}
                          disabled={isSavingEval}
                          className="bg-[#ff6600] hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors"
                        >
                          {isSavingEval ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              Save Evaluation
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 italic">Could not load task form details for this candidate submission.</p>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">
                Submitted on: {new Date(viewApp.taskSubmittedAt || viewApp.updatedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-3">
                <button onClick={() => setViewApp(null)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                  Close
                </button>
                <a
                  href={getFileUrl(viewApp.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  View Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
