'use client';

import { useState, useEffect } from 'react';
import { fetchAllTasks, createTask, updateTask, deleteTask, fetchAllCategories, updateCategory } from '../../../lib/api';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';

interface TaskLink {
  _id?: string;
  url: string;
  label: string;
  isActive: boolean;
}

interface Task {
  _id: string;
  name: string;
  content: string;
  taskLinks?: TaskLink[];
  createdAt?: string;
}

interface Category {
  _id: string;
  name: string;
  task0_6?: any;
  task1?: any;
  task2?: any;
  taskAbove2?: any;
  task0_6Active?: boolean;
  task1Active?: boolean;
  task2Active?: boolean;
  taskAbove2Active?: boolean;
}

const EXP_ROWS = [
  { key: 'task0_6', activeKey: 'task0_6Active', label: '0 – 6 Months', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
  { key: 'task1', activeKey: 'task1Active', label: '6 Months – 1 Year', badge: 'bg-purple-50 text-purple-600 border-purple-100' },
  { key: 'task2', activeKey: 'task2Active', label: '1 – 2 Years', badge: 'bg-teal-50 text-teal-600 border-teal-100' },
  { key: 'taskAbove2', activeKey: 'taskAbove2Active', label: '2+ Years', badge: 'bg-orange-50 text-[#ff6600] border-orange-100' },
] as const;

export default function InterviewTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  
  // Multiple links state
  const [taskLinks, setTaskLinks] = useState<TaskLink[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [linkToDeleteIndex, setLinkToDeleteIndex] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Pre-assign form
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([fetchAllTasks(), fetchAllCategories()]);
      if (tRes.success) setTasks(tRes.data);
      if (cRes.success) {
        setCategories(cRes.data);
        if (cRes.data.length > 0) setActiveTab(cRes.data[0]._id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchAllCategories();
      if (res.success) setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const handleToggleActive = async (cat: Category, activeKey: string, currentValue: boolean) => {
    const uid = cat._id + activeKey;
    setTogglingId(uid);
    try {
      await updateCategory(cat._id, { [activeKey]: !currentValue });
      setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, [activeKey]: !currentValue } : c));
    } catch (err) { console.error(err); alert('Failed to update status.'); }
    finally { setTogglingId(null); }
  };

  const getTask = (cat: Category, key: string): Task | null => {
    const ref = (cat as any)[key];
    if (!ref) return null;
    const id = ref?._id || ref;
    return tasks.find(t => t._id === id) || null;
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setContent('');
    setTaskLinks([]);
    setNewUrl('');
    setNewLabel('');
    setEditingLinkIndex(null);
    setSelectedCategoryId('');
    setSelectedExperienceLevel('');
  };

  const handleEdit = (task: Task) => {
    setEditingId(task._id);
    setName(task.name);
    setContent(task.content);
    setTaskLinks(task.taskLinks || []);
    setNewUrl('');
    setNewLabel('');
    setEditingLinkIndex(null);
    setIsAdding(true);
    setExpandedId(null);

    // Find if any category is using this task
    const linkedCat = categories.find(c =>
      (c.task0_6?._id || c.task0_6) === task._id ||
      (c.task1?._id || c.task1) === task._id ||
      (c.task2?._id || c.task2) === task._id ||
      (c.taskAbove2?._id || c.taskAbove2) === task._id
    );

    if (linkedCat) {
      setSelectedCategoryId(linkedCat._id);
      if ((linkedCat.task0_6?._id || linkedCat.task0_6) === task._id) setSelectedExperienceLevel('task0_6');
      else if ((linkedCat.task1?._id || linkedCat.task1) === task._id) setSelectedExperienceLevel('task1');
      else if ((linkedCat.task2?._id || linkedCat.task2) === task._id) setSelectedExperienceLevel('task2');
      else if ((linkedCat.taskAbove2?._id || linkedCat.taskAbove2) === task._id) setSelectedExperienceLevel('taskAbove2');
    } else {
      setSelectedCategoryId('');
      setSelectedExperienceLevel('');
    }
  };

  // Add or Edit Link in local state array
  const handleAddOrEditLink = () => {
    if (!newUrl.trim()) return alert('Please enter a URL.');

    const linkData: TaskLink = {
      url: newUrl.trim(),
      label: newLabel.trim() || `Link ${taskLinks.length + 1}`,
      isActive: taskLinks.length === 0 ? true : false // Default first link to active, others inactive
    };

    if (editingLinkIndex !== null) {
      const updated = [...taskLinks];
      updated[editingLinkIndex] = {
        ...updated[editingLinkIndex],
        url: linkData.url,
        label: linkData.label
      };
      setTaskLinks(updated);
      setEditingLinkIndex(null);
    } else {
      // If we already have links and one is active, keep it. Otherwise default new to active.
      const hasActive = taskLinks.some(l => l.isActive);
      if (hasActive) {
        linkData.isActive = false;
      }
      setTaskLinks([...taskLinks, linkData]);
    }

    setNewUrl('');
    setNewLabel('');
  };

  // Toggle active status in local list (ensure only one is active)
  const handleToggleLinkActive = (index: number) => {
    const updated = taskLinks.map((link, idx) => ({
      ...link,
      isActive: idx === index ? !link.isActive : false
    }));
    setTaskLinks(updated);
  };

  // Start editing single link item
  const handleStartEditLink = (index: number) => {
    const link = taskLinks[index];
    setNewUrl(link.url);
    setNewLabel(link.label);
    setEditingLinkIndex(index);
  };

  // Delete single link item from local list
  const handleDeleteLinkItem = (index: number) => {
    setLinkToDeleteIndex(index);
  };

  const confirmDeleteLink = () => {
    if (linkToDeleteIndex === null) return;
    const index = linkToDeleteIndex;
    const updated = taskLinks.filter((_, idx) => idx !== index);
    // If the deleted link was active, make the first remaining link active
    if (taskLinks[index]?.isActive && updated.length > 0) {
      updated[0].isActive = true;
    }
    setTaskLinks(updated);
    if (editingLinkIndex === index) {
      setEditingLinkIndex(null);
      setNewUrl('');
      setNewLabel('');
    }
    setLinkToDeleteIndex(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Please enter a task name.');
    if (!content.trim()) return alert('Please enter the task content/instructions.');
    if (selectedCategoryId && !selectedExperienceLevel) {
      return alert('Please select an experience level for the assigned category.');
    }
    setSaving(true);
    try {
      let savedTask: Task;
      if (editingId) {
        const res = await updateTask(editingId, { name, content, taskLinks });
        if (res.success) {
          savedTask = res.data;
          setTasks(tasks.map(t => t._id === editingId ? res.data : t));
        } else {
          alert(res.message || 'Failed to update task.');
          setSaving(false);
          return;
        }
      } else {
        const res = await createTask({ name, content, taskLinks });
        if (res.success) {
          savedTask = res.data;
          setTasks([res.data, ...tasks]);
        } else {
          alert(res.message || 'Failed to create task.');
          setSaving(false);
          return;
        }
      }

      // Handle category links update
      if (editingId) {
        const prevLinkedCat = categories.find(c =>
          (c.task0_6?._id || c.task0_6) === editingId ||
          (c.task1?._id || c.task1) === editingId ||
          (c.task2?._id || c.task2) === editingId ||
          (c.taskAbove2?._id || c.taskAbove2) === editingId
        );

        if (prevLinkedCat) {
          const prevField =
            (prevLinkedCat.task0_6?._id || prevLinkedCat.task0_6) === editingId ? 'task0_6' :
              (prevLinkedCat.task1?._id || prevLinkedCat.task1) === editingId ? 'task1' :
                (prevLinkedCat.task2?._id || prevLinkedCat.task2) === editingId ? 'task2' : 'taskAbove2';

          if (prevLinkedCat._id !== selectedCategoryId || prevField !== selectedExperienceLevel) {
            await updateCategory(prevLinkedCat._id, {
              [prevField]: null
            });
          }
        }
      }

      if (selectedCategoryId && selectedExperienceLevel) {
        await updateCategory(selectedCategoryId, {
          [selectedExperienceLevel]: savedTask._id
        });
      }

      resetForm();
      loadCategories();
    } catch (err) {
      console.error(err);
      alert('Error saving task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteTask(deleteId);
      if (res.success) {
        setTasks(tasks.filter(t => t._id !== deleteId));
      } else {
        alert(res.message || 'Failed to delete task.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting task.');
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const currentCategory = categories.find(c => c._id === activeTab);

  return (
    <>
      {/* Delete Confirm Modals */}
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        itemType="template"
      />

      <DeleteConfirmModal
        isOpen={linkToDeleteIndex !== null}
        onClose={() => setLinkToDeleteIndex(null)}
        onConfirm={confirmDeleteLink}
        itemType="link"
      />

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-5 min-h-[80vh]">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
            <p className="text-gray-500 mt-1 text-sm">Assign email templates to job categories by experience level.</p>
          </div>
          <button
            onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
            className="bg-[#ff6600] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            {isAdding ? <><span className="text-lg leading-none">✕</span> Cancel</> : <><span className="text-lg leading-none">+</span> New Template</>}
          </button>
        </div>

        {/* ── Form ── */}
        {isAdding && (
          <div className="bg-gradient-to-br from-orange-50/60 to-amber-50/40 border border-orange-100 rounded-2xl p-6 mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-1.5 bg-[#ff6600] rounded-full inline-block" />
              {editingId ? 'Edit Template' : 'New Template'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Template Name <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white font-medium"
                  placeholder="e.g. PHP Basic Template, React Developer Template..." />
                <p className="text-xs text-gray-400 mt-1">This name will appear in category assignment.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Assign to Job Category (Optional)</label>
                  <select value={selectedCategoryId} onChange={e => { setSelectedCategoryId(e.target.value); if (!e.target.value) setSelectedExperienceLevel(''); }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-gray-900 font-medium">
                    <option value="">-- Do Not Assign / Keep Unassigned --</option>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Experience Level {selectedCategoryId && <span className="text-red-500">*</span>}</label>
                  <select value={selectedExperienceLevel} onChange={e => setSelectedExperienceLevel(e.target.value)} disabled={!selectedCategoryId}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-gray-900 font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                    <option value="">-- Select Experience Level --</option>
                    <option value="task0_6">0 – 6 Months Experience</option>
                    <option value="task1">6 Months – 1 Year Experience</option>
                    <option value="task2">1 – 2 Years Experience</option>
                    <option value="taskAbove2">2+ Years Experience</option>
                  </select>
                </div>
              </div>

              {/* ── Multiple Task Links Management ── */}
              <div className="bg-white/60 border border-orange-100/70 rounded-2xl p-5 mt-2">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                  🔗 Manage Task Links (URLs)
                </label>

                {/* Inline URL Add/Edit Input controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Link Label (e.g. Task 1)</label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      placeholder="e.g. Task 1, Figma File..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-sm font-medium"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Task URL</label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      placeholder="https://docs.google.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-sm font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddOrEditLink}
                      className="flex-1 bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-3 rounded-xl transition-colors h-[42px]"
                    >
                      {editingLinkIndex !== null ? 'Update Link' : 'Add Link'}
                    </button>
                    {editingLinkIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLinkIndex(null);
                          setNewUrl('');
                          setNewLabel('');
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-3 rounded-xl transition-colors h-[42px]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Added task links listing */}
                {taskLinks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No links added yet. Add at least one link above.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {taskLinks.map((link, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          link.isActive
                            ? 'bg-green-50/50 border-green-200'
                            : 'bg-gray-50/50 border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-sm font-extrabold text-gray-400 w-6">#{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                              {link.label}
                              {link.isActive && (
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{link.url}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          {/* Active / Inactive Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleLinkActive(index)}
                            className="flex items-center gap-1.5 group"
                            title={link.isActive ? 'Active (email will send this)' : 'Inactive (click to activate)'}
                          >
                            <span className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                              link.isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                                link.isActive ? 'translate-x-3.5' : 'translate-x-0.5'
                              }`} />
                            </span>
                            <span className={`text-[10px] font-bold ${link.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </button>

                          {/* Edit Link Item */}
                          <button
                            type="button"
                            onClick={() => handleStartEditLink(index)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Link"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          {/* Delete Link Item */}
                          <button
                            type="button"
                            onClick={() => handleDeleteLinkItem(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Link"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-2">Note: You can add multiple task links, but only the toggled <strong>Active</strong> link will be sent to the candidate in the email.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Template Content <span className="text-red-500">*</span></label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={7}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-white text-sm leading-relaxed resize-none"
                  placeholder={`e.g.\nDear Candidate,\nKindly complete the remote interview task and submit via WhatsApp.\nWe are looking for immediate joiners.`} />
                <p className="text-xs text-gray-400 mt-1">This text appears below the active task link button in the candidate's email.</p>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={resetForm} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-gray-400 font-medium">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 mb-4">
              <span className="text-3xl">🗂️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No job categories yet</h3>
            <p className="text-gray-500 text-sm">Create job categories first, then assign templates here.</p>
          </div>
        ) : (
          <>
            {/* ── Category Tabs ── */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActiveTab(cat._id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap border ${activeTab === cat._id
                    ? 'bg-[#ff6600] text-white border-[#ff6600] shadow-sm shadow-orange-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-[#ff6600]'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* ── 4 Experience Rows ── */}
            {currentCategory && (
              <div className="space-y-3">
                {EXP_ROWS.map(row => {
                  const task = getTask(currentCategory, row.key);
                  const isActive = (currentCategory as any)[row.activeKey] !== false;
                  const isToggling = togglingId === (currentCategory._id + row.activeKey);
                  const rowExp = expandedId === (currentCategory._id + row.key);

                  // Extract active link from task links array
                  const activeLinkObj = task?.taskLinks?.find(l => l.isActive);

                  return (
                    <div key={row.key} className={`rounded-2xl border transition-all ${task
                      ? isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/60 opacity-75'
                      : 'border-dashed border-gray-200 bg-gray-50/40'
                      }`}>
                      <div className="flex items-center gap-3 p-2 flex-wrap">
                        {/* Experience badge */}
                        <span className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border ${row.badge}`}>
                          {row.label}
                        </span>

                        {/* Template info */}
                        <div className="flex-1 min-w-0">
                          {task ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 text-sm">{task.name}</p>
                                <span className="text-xs text-gray-400">· {task.content.length} chars</span>
                                {task.createdAt && <span className="text-xs text-gray-400">· {formatDate(task.createdAt)}</span>}
                              </div>
                              {activeLinkObj && (
                                <p className="text-xs text-blue-500 font-medium truncate max-w-md flex items-center gap-1">
                                  <span>🔗</span>
                                  <span className="font-bold text-gray-600 mr-1">[{activeLinkObj.label}]:</span>
                                  <a href={activeLinkObj.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {activeLinkObj.url}
                                  </a>
                                </p>
                              )}
                              {task.taskLinks && task.taskLinks.length > 1 && (
                                <p className="text-[10px] text-gray-400 font-medium">
                                  ({task.taskLinks.length} links saved, 1 active)
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No template assigned</p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task && (
                            <div className="flex flex-col items-center gap-0.5">
                              <button
                                onClick={() => handleToggleActive(currentCategory, row.activeKey, isActive)}
                                disabled={isToggling}
                                title={isActive ? 'Click to deactivate' : 'Click to activate'}
                                className={`relative inline-flex items-center h-7 rounded-full w-14 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                              >
                                <span className={`${isActive ? 'translate-x-8' : 'translate-x-1'} inline-block w-5 h-5 transform bg-white rounded-full transition-transform shadow-sm`} />
                              </button>
                              <p className={`text-xs font-bold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {isToggling ? '...' : isActive ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                          )}

                          {task && (
                            <button
                              onClick={() => setExpandedId(rowExp ? null : currentCategory._id + row.key)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${rowExp ? 'bg-orange-100 text-[#ff6600]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              title={rowExp ? 'Hide preview' : 'View preview'}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}

                          {task && (
                            <button onClick={() => handleEdit(task)}
                              className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit template">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}

                          {task && (
                            <button onClick={() => setDeleteId(task._id)}
                              className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Delete template">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}

                          {!task && (
                            <button
                              onClick={() => {
                                setIsAdding(true);
                                setSelectedCategoryId(currentCategory._id);
                                setSelectedExperienceLevel(row.key);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-[#ff6600] border border-orange-100 hover:bg-orange-100 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                              Assign Template
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Preview */}
                      {rowExp && task && (
                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 rounded-b-2xl">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Content Preview</p>
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{task.content}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
