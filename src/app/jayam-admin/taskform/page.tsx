'use client';

import { useState, useEffect } from 'react';
import { fetchAllCategories, fetchAllTaskForms, createTaskForm, updateTaskForm, deleteTaskForm } from '../../../lib/api';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';

type QuestionType = 'text' | 'checkbox' | 'radio' | 'select';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[]; // for radio, select, or checkbox options
  marks?: number;
  correctAnswers?: string[];
  optionMarks?: number[];
}

interface Section {
  id: string;
  heading: string;
  questions: Question[];
}

interface TaskFormTemplate {
  _id?: string;
  name: string;
  jobCategory: any; // populated Category object or Category ID
  experience: string;
  customSections: Section[];
}

interface Category {
  _id: string;
  name: string;
}

const EXP_LEVELS = [
  { key: 'task0_6', label: '0 – 6 Months Experience' },
  { key: 'task1', label: '6 Months – 1 Year Experience' },
  { key: 'task2', label: '1 – 2 Years Experience' },
  { key: 'taskAbove2', label: '2+ Years Experience' }
];

export default function TaskFormBuilderPage() {
  const [taskForms, setTaskForms] = useState<TaskFormTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [currentSections, setCurrentSections] = useState<Section[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [formsRes, catsRes] = await Promise.all([
        fetchAllTaskForms(),
        fetchAllCategories()
      ]);
      if (formsRes.success) {
        setTaskForms(formsRes.data);
      }
      if (catsRes.success) {
        setCategories(catsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setCurrentSections([
      ...currentSections,
      {
        id: Date.now().toString(),
        heading: 'New Section',
        questions: [{ id: Date.now().toString() + 'q', text: 'New Question', type: 'text', required: true, options: [], marks: 1, correctAnswers: [] }]
      }
    ]);
  };

  const updateSectionHeading = (sectionId: string, heading: string) => {
    setCurrentSections(currentSections.map(s => s.id === sectionId ? { ...s, heading } : s));
  };

  const removeSection = (sectionId: string) => {
    setCustomDeleteConfig({
      isOpen: true,
      title: "Delete Section",
      message: "Are you sure you want to delete this",
      itemType: "section and all its questions",
      onConfirm: () => {
        setCurrentSections(prev => prev.filter(s => s.id !== sectionId));
      }
    });
  };

  const addQuestionToSection = (sectionId: string) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: [
            ...s.questions,
            { id: Date.now().toString(), text: 'New Question', type: 'text', required: true, options: [], marks: 1, correctAnswers: [] }
          ]
        };
      }
      return s;
    }));
  };

  const updateQuestion = (sectionId: string, qId: string, updates: Partial<Question>) => {
    setCurrentSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
        };
      }
      return s;
    }));
  };

  const removeQuestion = (sectionId: string, qId: string) => {
    setCustomDeleteConfig({
      isOpen: true,
      title: "Delete Question",
      message: "Are you sure you want to delete this",
      itemType: "question",
      onConfirm: () => {
        setCurrentSections(prev => prev.map(s => {
          if (s.id === sectionId) {
            return { ...s, questions: s.questions.filter(q => q.id !== qId) };
          }
          return s;
        }));
      }
    });
  };

  const addOption = (sectionId: string, qId: string) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => {
            if (q.id === qId) {
              const newOpts = [...q.options, 'New Option'];
              const newMarksList = [...(q.optionMarks || [])];
              while (newMarksList.length < q.options.length) {
                newMarksList.push(undefined as any);
              }
              newMarksList.push(undefined as any);
              const marks = q.type === 'checkbox'
                ? newMarksList.reduce((acc, val) => acc + (val > 0 ? val : 0), 0)
                : (newMarksList.length > 0 ? Math.max(...newMarksList.filter(v => v !== undefined && v !== null)) : 1);
              return { ...q, options: newOpts, optionMarks: newMarksList, marks };
            }
            return q;
          })
        };
      }
      return s;
    }));
  };

  const updateOption = (sectionId: string, qId: string, optIndex: number, value: string) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => {
            if (q.id === qId) {
              const newOpts = [...q.options];
              newOpts[optIndex] = value;
              return { ...q, options: newOpts };
            }
            return q;
          })
        };
      }
      return s;
    }));
  };

  const updateOptionMark = (sectionId: string, qId: string, optIndex: number, rawVal: string) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => {
            if (q.id === qId) {
              const newMarksList = [...(q.optionMarks || [])];
              while (newMarksList.length < q.options.length) {
                newMarksList.push(undefined as any);
              }
              if (rawVal === '') {
                newMarksList[optIndex] = undefined as any;
              } else {
                newMarksList[optIndex] = Number(rawVal);
              }
              const marks = q.type === 'checkbox'
                ? newMarksList.reduce((acc, val) => acc + (val > 0 ? val : 0), 0)
                : (newMarksList.length > 0 ? Math.max(...newMarksList.filter(v => v !== undefined && v !== null)) : 1);
              return { ...q, optionMarks: newMarksList, marks };
            }
            return q;
          })
        };
      }
      return s;
    }));
  };

  const removeOption = (sectionId: string, qId: string, optIndex: number) => {
    setCustomDeleteConfig({
      isOpen: true,
      title: "Delete Option",
      message: "Are you sure you want to delete this",
      itemType: "option",
      onConfirm: () => {
        setCurrentSections(prev => prev.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              questions: s.questions.map(q => {
                if (q.id === qId) {
                  const newOpts = q.options.filter((_, i) => i !== optIndex);
                  const newMarksList = (q.optionMarks || []).filter((_, i) => i !== optIndex);
                  const marks = q.type === 'checkbox'
                    ? newMarksList.reduce((acc, val) => acc + (val > 0 ? val : 0), 0)
                    : (newMarksList.length > 0 ? Math.max(...newMarksList) : 1);
                  const updatedCorrect = (q.correctAnswers || [])
                    .filter(item => item !== optIndex.toString())
                    .map(item => {
                      const idx = parseInt(item);
                      return idx > optIndex ? (idx - 1).toString() : item;
                    });
                  return { ...q, options: newOpts, optionMarks: newMarksList, correctAnswers: updatedCorrect, marks };
                }
                return q;
              })
            };
          }
          return s;
        }));
      }
    });
  };

  const saveForm = async () => {
    if (!formName.trim()) return alert("Form Name is required");
    if (!selectedCategoryId) return alert("Please select a Job Category");
    if (!selectedExperience) return alert("Please select an Experience Level");

    const payload = {
      name: formName,
      jobCategory: selectedCategoryId,
      experience: selectedExperience,
      customSections: currentSections
    };

    try {
      let data;
      if (editingFormId) {
        data = await updateTaskForm(editingFormId, payload);
      } else {
        data = await createTaskForm(payload);
      }

      if (data.success) {
        setIsAdding(false);
        setFormName('');
        setSelectedCategoryId('');
        setSelectedExperience('');
        setCurrentSections([]);
        setEditingFormId(null);
        loadData(); // Reload to populate properly
      } else {
        alert(data.message || 'Error saving form');
      }
    } catch (error: any) {
      console.error('Error saving form:', error);
      const serverMsg = error.response?.data?.message || error.message || 'Error saving form';
      alert(`Error saving form: ${serverMsg}`);
    }
  };

  const handleEdit = (form: TaskFormTemplate) => {
    setFormName(form.name);
    setSelectedCategoryId(form.jobCategory?._id || form.jobCategory || '');
    setSelectedExperience(form.experience);
    setCurrentSections(form.customSections || []);
    setEditingFormId(form._id as string);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormName('');
    setSelectedCategoryId('');
    setSelectedExperience('');
    setCurrentSections([]);
    setEditingFormId(null);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [customDeleteConfig, setCustomDeleteConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemType: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemType: '',
    onConfirm: () => {}
  });

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        const data = await deleteTaskForm(deleteId);
        if (data.success) {
          setTaskForms(taskForms.filter(f => f._id !== deleteId));
        } else {
          alert(data.message || 'Error deleting form');
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Error deleting form');
      }
      setDeleteId(null);
    }
  };

  const getExperienceLabel = (key: string) => {
    return EXP_LEVELS.find(e => e.key === key)?.label || key;
  };

  return (
    <>
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        itemType="task form template"
      />
      <DeleteConfirmModal
        isOpen={customDeleteConfig.isOpen}
        onClose={() => setCustomDeleteConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={customDeleteConfig.onConfirm}
        title={customDeleteConfig.title}
        message={customDeleteConfig.message}
        itemType={customDeleteConfig.itemType}
      />
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 min-h-[80vh]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Task Form Builder</h2>
            <p className="text-gray-500 mt-1">Design customized remote interview forms for candidates by category and experience level.</p>
          </div>
          <button
            onClick={() => {
              if (isAdding) {
                handleCancel();
              } else {
                setIsAdding(true);
              }
            }}
            className="bg-[#ff6600] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            {isAdding ? '✕ Cancel' : '+ Create Task Form'}
          </button>
        </div>

        {isAdding && (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{editingFormId ? 'Edit Task Form Template' : 'Build New Task Form Template'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Task Form Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white"
                  placeholder="e.g. Graphic Designer Junior Task Form"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Job Category *</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-gray-900 font-medium"
                >
                  <option value="">-- Select Job Category --</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Experience Level *</label>
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-gray-900 font-medium"
                >
                  <option value="">-- Select Experience Level --</option>
                  {EXP_LEVELS.map(exp => (
                    <option key={exp.key} value={exp.key}>{exp.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6 mb-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-800">Dynamic Task Form Sections</h4>
                <button onClick={addSection} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all">
                  + Add Section
                </button>
              </div>

              {currentSections.map((section) => (
                <div key={section.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group">
                  <button
                    onClick={() => removeSection(section.id)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>

                  <div className="mb-6 pr-8">
                    <label className="block text-xs font-bold text-[#ff6600] uppercase tracking-wide mb-1">Section Name</label>
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => updateSectionHeading(section.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#ff6600]/30 focus:outline-none focus:border-[#ff6600] text-sm font-bold text-gray-900 bg-orange-50/30"
                    />
                  </div>

                  <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                    {section.questions.map((q, qIndex) => (
                      <div key={q.id} className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 relative group/q">
                        <button
                          onClick={() => removeQuestion(section.id, q.id)}
                          className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/q:opacity-100"
                        >
                          ✕
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pr-6">
                          <div className="md:col-span-2 flex justify-between items-end gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Question {qIndex + 1}</label>
                              <input
                                type="text"
                                value={q.text}
                                onChange={(e) => updateQuestion(section.id, q.id, { text: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#ff6600] text-sm font-medium bg-white"
                                placeholder="Enter question description or query..."
                              />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer pb-2">
                              <input
                                type="checkbox"
                                checked={q.required !== false}
                                onChange={(e) => updateQuestion(section.id, q.id, { required: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-[#ff6600] focus:ring-[#ff6600] accent-[#ff6600]"
                              />
                              <span className="text-sm font-bold text-gray-600">Required</span>
                            </label>
                          </div>
                          <div className={`md:col-span-2 grid grid-cols-1 ${q.type === 'text' ? 'sm:grid-cols-2' : ''} gap-4`}>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Question Type</label>
                              <select
                                value={q.type}
                                onChange={(e) => {
                                  const newType = e.target.value as any;
                                  const marksList = q.optionMarks || [];
                                  const newMarks = newType === 'checkbox'
                                    ? marksList.reduce((acc, val) => acc + (val > 0 ? val : 0), 0)
                                    : newType === 'radio'
                                      ? (marksList.length > 0 ? Math.max(...marksList.filter(v => v !== undefined && v !== null)) : 1)
                                      : (q.marks || 1);
                                  updateQuestion(section.id, q.id, { type: newType, correctAnswers: [], marks: newMarks });
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#ff6600] text-sm bg-white font-medium text-gray-800"
                              >
                                <option value="text">Input Box (Single Line)</option>
                                <option value="radio">Radio Buttons (Select One)</option>
                                <option value="checkbox">Checkboxes (Multiple Select)</option>
                              </select>
                            </div>
                            {q.type === 'text' && (
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Marks</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={q.marks !== undefined ? q.marks : 1}
                                  onChange={(e) => updateQuestion(section.id, q.id, { marks: Number(e.target.value) })}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#ff6600] text-sm bg-white font-semibold text-gray-900"
                                  placeholder="Marks"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {(q.type === 'checkbox' || q.type === 'radio') && (
                          <div className="bg-white p-4 rounded-lg border border-gray-100 mt-3">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Options</label>
                                <p className="text-[10px] text-gray-400 mt-0.5">Assign mark values directly to each option below.</p>
                              </div>
                              <button onClick={() => addOption(section.id, q.id)} className="text-xs text-[#ff6600] font-bold hover:underline">+ Add Option</button>
                            </div>
                            <div className="space-y-2">
                              {q.options.map((opt, optIndex) => {
                                return (
                                  <div key={optIndex} className="flex items-center gap-3">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateOption(section.id, q.id, optIndex, e.target.value)}
                                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none text-sm font-medium text-gray-800"
                                      placeholder="Option text"
                                    />
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marks:</span>
                                      <input
                                        type="number"
                                        min={0}
                                        value={(q.optionMarks && q.optionMarks[optIndex] !== undefined) ? q.optionMarks[optIndex] : ''}
                                        onChange={(e) => updateOptionMark(section.id, q.id, optIndex, e.target.value)}
                                        className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-gray-200 focus:outline-none focus:border-[#ff6600] text-center text-gray-800 bg-white"
                                        placeholder="0"
                                      />
                                    </div>
                                    <button onClick={() => removeOption(section.id, q.id, optIndex)} className="text-gray-400 hover:text-red-500 shrink-0">
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                              {q.options.length === 0 && <p className="text-xs text-gray-400 italic">No options added yet.</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => addQuestionToSection(section.id)}
                      className="text-sm font-bold text-[#ff6600] flex items-center gap-1 hover:underline mt-2"
                    >
                      <span>+</span> Add Another Question to this Section
                    </button>
                  </div>
                </div>
              ))}
              {currentSections.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium">
                  No sections added yet. Click "+ Add Section" to begin.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveForm} className="bg-[#ff6600] hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all">
                {editingFormId ? 'Update Task Form' : 'Save Task Form'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium">Loading task forms...</div>
          ) : taskForms.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
              No task forms created yet. Click "+ Create Task Form" to start.
            </div>
          ) : (
            taskForms.map(form => (
              <div key={form._id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group relative flex flex-col justify-between">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => handleEdit(form)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm" title="Edit">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(form._id as string)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm" title="Delete">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-[#ff6600]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight pr-20">{form.name}</h3>
                  <div className="flex flex-wrap gap-1.5 my-2">
                    <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider border border-orange-100">
                      {form.jobCategory?.name || 'Unknown Category'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                      {getExperienceLabel(form.experience)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-4 font-semibold">
                    {(form.customSections || []).length} Custom Section{(form.customSections || []).length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Structure Preview</p>
                  <ul className="text-sm text-gray-600 space-y-1.5">
                    {(form.customSections || []).slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600]"></span> {s.heading} <span className="text-xs text-gray-400">({s.questions.length} questions)</span>
                      </li>
                    ))}
                    {(form.customSections || []).length > 3 && (
                      <li className="flex items-center gap-2 text-gray-400 pl-3 italic">
                        + {(form.customSections || []).length - 3} more sections
                      </li>
                    )}
                    {(form.customSections || []).length === 0 && (
                      <li className="text-gray-400 text-xs italic">Empty form structure</li>
                    )}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
