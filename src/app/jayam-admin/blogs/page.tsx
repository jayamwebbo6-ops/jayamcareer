'use client';

import { useState, useEffect } from 'react';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';
import { fetchAllBlogs, createBlog, updateBlog, deleteBlog } from '../../../lib/api';

// Using a static string path since we are DB backed now
const defaultImg = '/blogs/marketing.png';

const getImageUrl = (imgStr: string) => {
  if (!imgStr) return '';
  if (imgStr.startsWith('data:') || imgStr.startsWith('blob:') || imgStr.startsWith('http')) return imgStr;
  
  // Dynamically detect base path from browser window if running in client
  let dynamicBasePath = '';
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const adminIndex = pathname.indexOf('/admin');
    if (adminIndex !== -1) {
      dynamicBasePath = pathname.substring(0, adminIndex);
    }
  }
  
  const resolvedBasePath = dynamicBasePath || process.env.NEXT_PUBLIC_BASE_URL || '';
  
  if (resolvedBasePath && imgStr.startsWith(resolvedBasePath)) return imgStr;
  return `${resolvedBasePath}${imgStr.startsWith('/') ? '' : '/'}${imgStr}`;
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);   
  const [isSaving, setIsSaving] = useState(false);

  const fetchBlogs = async () => {
    try {
      const data = await fetchAllBlogs();
      setBlogs(data);
    } catch (error) {
      console.error('Failed to fetch blogs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory('');
    setExcerpt('');
    setContent('');
    setImage('');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (blog: any) => {
    setEditingId(blog._id);
    setTitle(blog.title);
    setCategory(blog.category);
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setImage(typeof blog.image === 'string' ? blog.image : '');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteBlog(deleteId);
        await fetchBlogs();
      } catch (error) {
        console.error('Failed to delete blog', error);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category || 'General');
    formData.append('excerpt', excerpt);
    formData.append('content', content);
    formData.append('date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
    formData.append('author', 'Admin User');

    if (imageFile) {
      formData.append('imageFile', imageFile);
    } else if (image) {
      formData.append('image', image);
    } else {
      formData.append('image', defaultImg);
    }

    try {
      if (editingId) {
        // Edit existing
        await updateBlog(editingId, formData);
      } else {
        // Create new
        await createBlog(formData);
      }
      await fetchBlogs();
    } catch (error) {
      console.error('Failed to save blog', error);
    } finally {
      setIsSaving(false);
    }

    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff6600]"></div>
      </div>
    );
  }

  return (
    <>
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        itemType="blog"
      />
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 relative min-h-[80vh]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Blogs</h1>
            <p className="text-gray-500 mt-1">View and manage your blog publications.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-[#ff6600] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            + Create New Blog
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-4 font-bold text-gray-400 uppercase tracking-wider text-sm w-[40%]">Article</th>
                <th className="py-4 font-bold text-gray-400 uppercase tracking-wider text-sm w-[20%]">Category</th>
                <th className="py-4 font-bold text-gray-400 uppercase tracking-wider text-sm w-[20%]">Date</th>
                <th className="py-4 font-bold text-gray-400 uppercase tracking-wider text-sm text-right w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    No blogs found.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden relative shrink-0">
                          <img src={getImageUrl(blog.image)} alt={blog.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 line-clamp-1">{blog.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{blog.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                        {blog.category}
                      </span>
                    </td>
                    <td className="py-4 text-gray-500 text-sm font-medium">
                      {blog.date}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(blog)}
                          className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id as string)}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-sm">Showing {blogs.length} published articles.</p>
        </div>

        {/* Editor Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh]">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Article' : 'Create New Article'}</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Article Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50/50 focus:bg-white"
                      placeholder="e.g., The Future of Web Design"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50/50 focus:bg-white"
                      placeholder="e.g., Design, Marketing"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Short Excerpt</label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      required
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50/50 focus:bg-white resize-none"
                      placeholder="A brief summary of the article..."
                    ></textarea>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Cover Image</label>
                    <div className="flex items-center gap-4">
                      {image && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                          <img src={getImageUrl(image)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50/50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Full Content</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50/50 focus:bg-white resize-none"
                      placeholder="Write your full article here..."
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100 shrink-0 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#ff6600] hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSaving && (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {editingId ? (isSaving ? 'Saving...' : 'Save Changes') : (isSaving ? 'Publishing...' : 'Publish Article')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
