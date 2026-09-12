'use client';

import { useState, useEffect } from 'react';
import { fetchAdminEmails, updateAdminEmails } from '../../../lib/api';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';

export default function AdminProfilePage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadEmails = async () => {
      try {
        setFetching(true);
        const data = await fetchAdminEmails();
        if (data.success) {
          setEmails(data.emails || []);
        }
      } catch (err: any) {
        console.error('Failed to load admin emails:', err);
        setError('Failed to load current admin emails.');
      } finally {
        setFetching(false);
      }
    };
    loadEmails();
  }, []);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (emails.includes(cleanEmail)) {
      setError('This email is already in the list.');
      return;
    }

    setEmails([...emails, cleanEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setError('');
    setSuccess('');

    if (emails.length <= 1) {
      setError('Minimum of 1 admin email is required. You cannot delete the last email.');
      return;
    }

    setEmailToDelete(emailToRemove);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (emailToDelete) {
      setEmails(emails.filter(e => e !== emailToDelete));
      setEmailToDelete(null);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (emails.length === 0) {
      setError('At least one admin email is required.');
      return;
    }

    setLoading(true);
    try {
      const data = await updateAdminEmails(emails);
      if (data.success) {
        setSuccess('Admin emails updated successfully.');
        setEmails(data.emails || []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update admin emails.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile & Security</h1>
        <p className="text-gray-500 mt-1">Manage authorized admin email addresses for OTP login.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
          {success}
        </div>
      )}

      {fetching ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <svg className="animate-spin w-8 h-8 text-[#ff6600]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-gray-400 text-sm mt-3 font-semibold">Loading admin emails...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Email Form */}
          <form onSubmit={handleAddEmail} className="flex gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 text-gray-900 text-sm font-medium"
              placeholder="Add new admin email..."
            />
            <button
              type="submit"
              className="bg-[#ff6600] hover:bg-orange-600 text-white px-6 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Emails List */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Authorized Admin Emails</label>
            {emails.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No admin emails configured.</p>
            ) : (
              <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 overflow-hidden">
                {emails.map((email) => (
                  <div key={email} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-bold text-gray-800">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      disabled={emails.length <= 1}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={emails.length <= 1 ? "Cannot delete the last remaining email" : "Delete email"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#ff6600] hover:bg-orange-600 text-white py-3.5 px-6 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center disabled:opacity-70 mt-6 cursor-pointer"
          >
            {loading ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEmailToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Remove Admin Email"
        message="Are you sure you want to remove the email address"
        itemType={emailToDelete ? `"${emailToDelete}"` : 'this email'}
      />
    </div>
  );
}
