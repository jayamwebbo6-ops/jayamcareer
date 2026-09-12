'use client';

import { useState, useEffect } from 'react';
import { fetchAllForms, createForm, updateForm, deleteForm } from '../../../lib/api';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';

type QuestionType = 'text' | 'checkbox' | 'radio';


interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[]; // for radio or checkbox multi-options
}

interface Section {
  id: string;
  heading: string;
  questions: Question[];
}

interface ApplicationForm {
  _id?: string;
  name: string;
  customSections: Section[];
}

const StaticTopSection = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm opacity-80 pointer-events-none">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Static Top Section</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number *</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email ID *</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Native Place *</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" disabled />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Are you currently based in Chennai? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> No</label>
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Are you available to join within a week? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> No</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Marital Status *</label>
        <select className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white" disabled>
          <option>Select Status</option>
          <option>Single</option>
          <option>Married</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth *</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" disabled />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Total Work Experience</label>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Fresher</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" checked disabled /> Experienced</label>
        </div>
        <select className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white" disabled>
          <option>0-6 Months</option>
          <option>1 Year</option>
          <option>2 Years</option>
          <option>Above 2 Years</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Degree *</label>
        <select className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white" disabled>
          <option>Select Degree</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialization / Major *</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" placeholder="e.g., Computer Science, Marketing" disabled />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">University / College *</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" placeholder="e.g., Anna University" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Graduation Year *</label>
        <select className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white" disabled>
          <option>Select Year</option>
          <option>2011</option>
          <option>2012</option>
          <option>2013</option>
          <option>2014</option>
          <option>2015</option>
          <option>2016</option>
          <option>2017</option>
          <option>2018</option>
          <option>2019</option>
          <option>2020</option>
          <option>2021</option>
          <option>2022</option>
          <option>2023</option>
          <option>2024</option>
          <option>2025</option>
          <option>2026</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Do you have any career gap? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> No</label>
        </div>
      </div>
    </div>

    <h3 className="text-xl font-bold text-gray-800 mb-6">Professional & Technical Information</h3>

    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 h-px bg-gray-100"></div>
      <span className="text-sm font-medium text-gray-500">Current Employment Status</span>
      <div className="flex-1 h-px bg-gray-100"></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Are you working currently? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> No</label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Are you serving notice period? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> No</label>
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">If you are selected you are requested to give a copy of the last 3 months bank statement as Salary Proof. Will you be able to submit the last 3 months bank statement? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> No</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">What's the monthly salary amount credited in your bank account</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notice Period</label>
        <select className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white" disabled>
          <option>Select</option>
          <option>Immediate</option>
          <option>7 Days</option>
          <option>15 Days</option>
          <option>30 Days</option>
          <option>2 months</option>
          <option>Serving</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Job Change (optional)</label>
        <textarea className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white h-24" disabled></textarea>
      </div>
    </div>

    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 h-px bg-gray-100"></div>
      <span className="text-sm font-medium text-gray-500">Project Experience</span>
      <div className="flex-1 h-px bg-gray-100"></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Have you worked on client projects? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> No</label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Do you prefer to work independently or in a team? *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Independently</label>
          <label className="flex items-center gap-2"><input type="radio" className="w-4 h-4" disabled /> Team</label>
        </div>
      </div>
    </div>
  </div>
);

const StaticBottomSection = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 mt-6 shadow-sm opacity-80 pointer-events-none">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4 flex-1 mr-4">
        <div className="flex-1 h-px bg-gray-100"></div>
        <span className="text-sm font-medium text-gray-500">Compensation & Availability</span>
        <div className="flex-1 h-px bg-gray-100"></div>
      </div>
      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap">Static Bottom Section</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">What's the monthly salary amount credited in your bank account</label>
        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white" disabled />
      </div>


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">How soon can you join?</label>
        <select className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white" disabled>
          <option>Select</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Your Resume (PDF/DOC) *</label>
        <div className="w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-700 bg-gray-50 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Click to upload your resume
        </div>
      </div>
    </div>

    <div className="pt-6 border-t border-gray-100">
      <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold" disabled>
        Submit Application
      </button>
    </div>
  </div>
);

export default function FormBuilderPage() {
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const data = await fetchAllForms();
      if (data.success) {
        setForms(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch forms', error);
    } finally {
      setLoading(false);
    }
  };

  // State for new form builder
  const [formName, setFormName] = useState('');
  const [currentSections, setCurrentSections] = useState<Section[]>([]);

  const addSection = () => {
    setCurrentSections([
      ...currentSections,
      {
        id: Date.now().toString(),
        heading: 'New Section',
        questions: [{ id: Date.now().toString() + 'q', text: 'New Question', type: 'text', required: true, options: [] }]
      }
    ]);
  };

  const updateSectionHeading = (sectionId: string, heading: string) => {
    setCurrentSections(currentSections.map(s => s.id === sectionId ? { ...s, heading } : s));
  };

  const removeSection = (sectionId: string) => {
    setCurrentSections(currentSections.filter(s => s.id !== sectionId));
  };

  const addQuestionToSection = (sectionId: string) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: [
            ...s.questions,
            { id: Date.now().toString(), text: 'New Question', type: 'text', required: true, options: [] }
          ]
        };
      }
      return s;
    }));
  };

  const updateQuestion = (sectionId: string, qId: string, field: keyof Question, value: any) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => q.id === qId ? { ...q, [field]: value } : q)
        };
      }
      return s;
    }));
  };

  const removeQuestion = (sectionId: string, qId: string) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return { ...s, questions: s.questions.filter(q => q.id !== qId) };
      }
      return s;
    }));
  };

  const addOption = (sectionId: string, qId: string) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => q.id === qId ? { ...q, options: [...q.options, 'New Option'] } : q)
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

  const removeOption = (sectionId: string, qId: string, optIndex: number) => {
    setCurrentSections(currentSections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => {
            if (q.id === qId) {
              return { ...q, options: q.options.filter((_, i) => i !== optIndex) };
            }
            return q;
          })
        };
      }
      return s;
    }));
  };

  const saveForm = async () => {
    if (!formName.trim()) return alert("Form Name is required");

    const newForm = {
      name: formName,
      customSections: currentSections
    };

    try {
      let data;
      if (editingFormId) {
        data = await updateForm(editingFormId, newForm);
      } else {
        data = await createForm(newForm);
      }

      if (data.success) {
        if (editingFormId) {
          setForms(forms.map(f => f._id === editingFormId ? data.data : f));
        } else {
          setForms([data.data, ...forms]);
        }
        setIsAdding(false);
        setFormName('');
        setCurrentSections([]);
        setEditingFormId(null);
      } else {
        alert(data.message || 'Error saving form');
      }
    } catch (error) {
      console.error('Error saving form', error);
      alert('Error saving form');
    }
  };

  const handleEdit = (form: ApplicationForm) => {
    setFormName(form.name);
    setCurrentSections(form.customSections || []);
    setEditingFormId(form._id as string);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormName('');
    setCurrentSections([]);
    setEditingFormId(null);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        const data = await deleteForm(deleteId);
        if (data.success) {
          setForms(forms.filter(f => f._id !== deleteId));
        } else {
          alert(data.message || 'Error deleting form');
        }
      } catch (error) {
        console.error('Error deleting form', error);
        alert('Error deleting form');
      }
      setDeleteId(null);
    }
  };

  return (
    <>
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        itemType="form template"
      />
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Form Builder</h2>
            <p className="text-gray-500 mt-1">Design custom forms for different job categories.</p>
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
            {isAdding ? '✕ Cancel' : '+ Create New Form'}
          </button>
        </div>

        {isAdding && (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{editingFormId ? 'Edit Form Template' : 'Build New Form Template'}</h3>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Form Template Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white"
                placeholder="e.g. Graphic Designer Application Form"
              />
            </div>

            <StaticTopSection />

            <div className="space-y-6 mb-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-800">Custom Dynamic Sections</h4>
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
                    <label className="block text-xs font-bold text-[#ff6600] uppercase tracking-wide mb-1">Section Heading</label>
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
                                onChange={(e) => updateQuestion(section.id, q.id, 'text', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#ff6600] text-sm font-medium bg-white"
                              />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer pb-2">
                              <input
                                type="checkbox"
                                checked={q.required !== false}
                                onChange={(e) => updateQuestion(section.id, q.id, 'required', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#ff6600] focus:ring-[#ff6600] accent-[#ff6600]"
                              />
                              <span className="text-sm font-bold text-gray-600">Required</span>
                            </label>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Question Type</label>
                            <select
                              value={q.type}
                              onChange={(e) => updateQuestion(section.id, q.id, 'type', e.target.value)}
                              className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#ff6600] text-sm bg-white"
                            >
                              <option value="text">Text Input (Single Line)</option>
                              <option value="checkbox">Checkbox (Multiple Select)</option>
                              <option value="radio">Radio Buttons (Single Select)</option>
                            </select>
                          </div>
                        </div>

                        {(q.type === 'checkbox' || q.type === 'radio') && (
                          <div className="bg-white p-4 rounded-lg border border-gray-100 mt-3">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Options</label>
                              <button onClick={() => addOption(section.id, q.id)} className="text-xs text-[#ff6600] font-bold hover:underline">+ Add Option</button>
                            </div>
                            <div className="space-y-2">
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  {q.type === 'radio' ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                  ) : (
                                    <div className="w-4 h-4 rounded border-2 border-gray-300"></div>
                                  )}
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(section.id, q.id, optIndex, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none text-sm"
                                  />
                                  <button onClick={() => removeOption(section.id, q.id, optIndex)} className="text-gray-400 hover:text-red-500">
                                    ✕
                                  </button>
                                </div>
                              ))}
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
                  No custom sections added yet.
                </div>
              )}
            </div>

            <StaticBottomSection />

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button onClick={saveForm} className="bg-[#ff6600] hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all">
                {editingFormId ? 'Update Form Template' : 'Save Form Template'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium">Loading forms...</div>
          ) : forms.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
              No form templates created yet. Click "+ Create New Form" to start.
            </div>
          ) : (
            forms.map(form => (
              <div key={form._id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => handleEdit(form)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm" title="Edit">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(form._id as string)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm" title="Delete">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-orange-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{form.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Fixed Headers + {(form.customSections || []).length} Custom Section{(form.customSections || []).length !== 1 ? 's' : ''}
                </p>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Structure Preview</p>
                  <ul className="text-sm text-gray-600 space-y-1.5">
                    <li className="flex items-center gap-2 text-blue-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Personal Info (Fixed)
                    </li>
                    {(form.customSections || []).slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600]"></span> {s.heading} <span className="text-xs text-gray-400">({s.questions.length} qs)</span>
                      </li>
                    ))}
                    {(form.customSections || []).length > 3 && (
                      <li className="flex items-center gap-2 text-gray-400 pl-3 italic">
                        + {(form.customSections || []).length - 3} more sections
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-blue-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Compensation (Fixed)
                    </li>
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-orange-500 font-bold bg-orange-50 inline-block px-4 py-2 rounded-full">
            Form templates update statically. Next we will attach these to categories.
          </p>
        </div>
      </div>
    </>
  );
}
