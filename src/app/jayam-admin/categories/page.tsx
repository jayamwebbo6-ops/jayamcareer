'use client';

import { useState, useEffect } from 'react';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';
import { fetchAllCategories, createCategory, updateCategory, deleteCategory, fetchAllForms, fetchAllTasks } from '../../../lib/api';

interface Category {
  _id?: string;
  name: string;
  icon: string;
  description: string;
  responsibilities: string[];
  isActive: boolean;
  displayOrder?: number;
  formId?: any; // String ID or populated object
  task0_6?: any; // ObjectId or populated Task object
  task1?: any;
  task2?: any;
  taskAbove2?: any;
}

interface TaskTemplate {
  _id: string;
  name: string;
  content: string;
}

interface FormTemplate {
  _id: string;
  name: string;
}


export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableForms, setAvailableForms] = useState<FormTemplate[]>([]);
  const [availableTasks, setAvailableTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [formId, setFormId] = useState<string>('');
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [task0_6, setTask0_6] = useState('');
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');
  const [taskAbove2, setTaskAbove2] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catsRes, formsRes, tasksRes] = await Promise.all([
          fetchAllCategories(),
          fetchAllForms(),
          fetchAllTasks(),
        ]);
        if (catsRes.success) setCategories(catsRes.data);
        if (formsRes.success) setAvailableForms(formsRes.data);
        if (tasksRes.success) setAvailableTasks(tasksRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddResponsibility = () => setResponsibilities([...responsibilities, '']);
  const handleResponsibilityChange = (index: number, value: string) => {
    const newRes = [...responsibilities];
    newRes[index] = value;
    setResponsibilities(newRes);
  };
  const handleRemoveResponsibility = (index: number) => {
    if (responsibilities.length === 1) return;
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setIcon('');
    setDescription('');
    setFormId('');
    setResponsibilities(['']);
    setTask0_6('');
    setTask1('');
    setTask2('');
    setTaskAbove2('');
  };

  const getTaskId = (taskRef: any) => {
    if (!taskRef) return '';
    if (typeof taskRef === 'string') return taskRef;
    return taskRef._id || '';
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat._id as string);
    setName(cat.name);
    setIcon(cat.icon);
    setDescription(cat.description);
    setFormId(cat.formId ? (cat.formId._id || cat.formId) : '');
    setResponsibilities(cat.responsibilities && cat.responsibilities.length > 0 ? cat.responsibilities : ['']);
    setTask0_6(getTaskId(cat.task0_6));
    setTask1(getTaskId(cat.task1));
    setTask2(getTaskId(cat.task2));
    setTaskAbove2(getTaskId(cat.taskAbove2));
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !icon.trim() || !description.trim()) {
      return alert("Please fill in all required fields (Name, Icon, Description).");
    }

    const payload = {
      name,
      icon,
      description,
      formId: formId || null,
      responsibilities: responsibilities.filter(r => r.trim() !== ''),
      task0_6: task0_6 || null,
      task1: task1 || null,
      task2: task2 || null,
      taskAbove2: taskAbove2 || null,
    };

    try {
      if (editingId) {
        const res = await updateCategory(editingId, payload);
        if (res.success) {
          setCategories(categories.map(c => c._id === editingId ? res.data : c));
          resetForm();
        } else {
          alert(res.message);
        }
      } else {
        const res = await createCategory(payload);
        if (res.success) {
          setCategories([res.data, ...categories]);
          resetForm();
        } else {
          alert(res.message);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error saving category");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await updateCategory(id, { isActive: !currentStatus });
      if (res.success) {
        setCategories(categories.map(cat =>
          cat._id === id ? { ...cat, isActive: !currentStatus } : cat
        ));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const previousCategories = categories;
    const reorderedCategories = [...categories];
    [reorderedCategories[index], reorderedCategories[targetIndex]] = [
      reorderedCategories[targetIndex],
      reorderedCategories[index],
    ];
    const updatedCategories = reorderedCategories.map((category, order) => ({
      ...category,
      displayOrder: order,
    }));
    setCategories(updatedCategories);

    try {
      const results = await Promise.all(
        updatedCategories.map(category =>
          updateCategory(category._id as string, { displayOrder: category.displayOrder })
        )
      );
      if (results.some(result => !result.success)) throw new Error('Failed to save category order');
    } catch (error) {
      setCategories(previousCategories);
      console.error(error);
      alert('Could not save category order');
    }
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        const res = await deleteCategory(deleteId);
        if (res.success) {
          setCategories(categories.filter(cat => cat._id !== deleteId));
        }
      } catch (error) {
        console.error(error);
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
        itemType="category"
      />
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 min-h-[80vh]">
        {isAdding ? (
          /* Form View (Full-Page Edit/Create Screen) */
          <div className="animate-in fade-in duration-300">
            {/* Form Header with Back Button */}
            <div className="flex items-center gap-4 mb-8 pb-5 border-b border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-100 transition-all shadow-sm active:scale-95"
                title="Go Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Job Category' : 'Create Job Category'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fill in the fields below to {editingId ? 'update the' : 'add a new'} category template.</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Category Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white font-medium text-gray-800"
                    placeholder="e.g. PHP Web Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Google Material Icon Name *</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white font-medium text-gray-800"
                    placeholder="e.g. work, code, terminal"
                  />
                  <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1.5 inline-block font-medium">Browse Google Icons</a>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white h-24 resize-none font-medium text-gray-800"
                    placeholder="Brief summary of the role..."
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Linked Application Form Template (Optional)</label>
                  <select
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-gray-900 font-bold"
                  >
                    <option value="">-- No Form Linked (Default) --</option>
                    {availableForms.map(form => (
                      <option key={form._id} value={form._id}>{form.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">When candidates apply for this role, they will be prompted to fill out this specific form template.</p>
                </div>

                {/* Responsibilities */}
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-gray-700">Responsibilities</label>
                    <button 
                      type="button" 
                      onClick={handleAddResponsibility} 
                      className="text-xs bg-orange-50 text-[#ff6600] hover:bg-[#ff6600] hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-orange-100/50 shadow-sm active:scale-95"
                    >
                      + Add Point
                    </button>
                  </div>
                  <div className="space-y-3">
                    {responsibilities.map((res, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm font-bold w-4">{index + 1}.</span>
                        <input
                          type="text"
                          value={res}
                          onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white font-medium text-gray-800"
                          placeholder="Enter a responsibility..."
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsibility(index)}
                          disabled={responsibilities.length === 1}
                          className={`p-2.5 rounded-xl ${responsibilities.length === 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50 hover:text-red-600'} transition-colors`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#ff6600] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                >
                  {editingId ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* List View (Table Screen) */
          <div className="animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Job Categories & Openings</h2>
                <p className="text-gray-500 mt-1">Manage categories and toggle active job openings directly.</p>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="bg-[#ff6600] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                + Create Category
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-gray-500 font-medium">Loading job categories...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-sm tracking-wider uppercase">
                      <th className="pb-4 font-bold w-20 text-center">Icon</th>
                      <th className="pb-4 font-bold">Category & Linked Form</th>
                      <th className="pb-4 font-bold text-center">Opening Status</th>
                      <th className="pb-4 font-bold text-center">Order</th>
                      <th className="pb-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categories.map((cat) => (
                      <tr key={cat._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="py-4 text-center">
                          <div className="w-12 h-12 mx-auto bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">{cat.icon || 'work'}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-bold text-gray-900 text-lg">{cat.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1 mt-0.5 mb-2">{cat.description}</p>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold tracking-wide uppercase border border-blue-100">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {cat.formId ? (cat.formId.name || cat.formId) : 'Default Generic Form'}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => toggleStatus(cat._id as string, cat.isActive)}
                            className={`relative inline-flex items-center h-7 rounded-full w-14 transition-colors focus:outline-none ${cat.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <span className={`${cat.isActive ? 'translate-x-8' : 'translate-x-1'} inline-block w-5 h-5 transform bg-white rounded-full transition-transform`} />
                          </button>
                          <p className={`text-xs font-bold mt-1 ${cat.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => moveCategory(categories.indexOf(cat), -1)}
                              disabled={categories.indexOf(cat) === 0}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-[#ff6600] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <span aria-hidden="true">&#8593;</span>
                            </button>
                            <button
                              onClick={() => moveCategory(categories.indexOf(cat), 1)}
                              disabled={categories.indexOf(cat) === categories.length - 1}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-[#ff6600] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <span aria-hidden="true">&#8595;</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(cat)}
                              className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(cat._id as string)}
                              className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-500">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <span className="material-symbols-outlined text-gray-400 text-3xl">work_off</span>
                          </div>
                          <p className="font-medium text-gray-900">No categories found</p>
                          <p className="text-sm mt-1">Create a new job category to get started.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
