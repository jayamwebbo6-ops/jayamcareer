'use client';

import { useState, useEffect } from 'react';
import { fetchSmtpConfig, updateSmtpConfig, fetchOfferTemplate, updateOfferTemplate } from '../../../lib/api';

export default function SmtpSettingsPage() {
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [from, setFrom] = useState('');
  const [cc, setCc] = useState('');
  const [hasPassword, setHasPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Offer Letter Template state
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [templateError, setTemplateError] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        const [smtpData, templateData] = await Promise.all([
          fetchSmtpConfig(),
          fetchOfferTemplate()
        ]);

        if (smtpData) {
          setHost(smtpData.host || '');
          setPort(smtpData.port || 587);
          setSecure(!!smtpData.secure);
          setUser(smtpData.user || '');
          setPass(''); // Kept empty for editing
          setFrom(smtpData.from || '');
          setCc(smtpData.cc || '');
          setHasPassword(!!smtpData.hasPassword);
        }

        if (templateData && templateData.success) {
          setTemplateSubject(templateData.data.subject || '');
          setTemplateBody(templateData.data.body || '');
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load configuration.');
      } finally {
        setFetching(false);
      }
    }
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateSmtpConfig({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user,
        pass, // Will not update password if left empty on backend
        from,
        cc
      });
      setSuccess('SMTP settings updated successfully!');
      if (pass) {
        setHasPassword(true);
        setPass('');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update SMTP settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateError('');
    setTemplateSuccess('');
    setSavingTemplate(true);

    try {
      await updateOfferTemplate({
        subject: templateSubject,
        body: templateBody
      });
      setTemplateSuccess('Offer letter template updated successfully!');
    } catch (err: any) {
      console.error(err);
      setTemplateError(err.response?.data?.error || 'Failed to update template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6600]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: SMTP Configuration */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">SMTP Configurations</h1>
            <p className="text-gray-500 mt-1">Configure SMTP credentials dynamically to send emails to candidates.</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">SMTP Username / Email</label>
              <input
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 text-gray-900"
                placeholder="e.g. sender@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                SMTP Password {hasPassword && <span className="text-xs text-green-600 font-normal ml-2">(Already configured)</span>}
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={hasPassword ? "Leave blank to keep existing password" : "Enter SMTP/App password"}
                required={!hasPassword}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">SMTP From Email Header</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 text-gray-900"
                placeholder='e.g. "Jayam Web Solutions" <sender@gmail.com>'
              />
              <p className="text-xs text-gray-400 mt-1">Specify display name and email address to represent sender.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">SMTP CC Email Address</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 text-gray-900"
                placeholder="e.g. hr@jayamwebsolutions.com, admin@jayamwebsolutions.com"
              />
              <p className="text-xs text-gray-400 mt-1">Optional. Copy these email addresses on every sent task and thank you email (comma separated).</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6600] hover:bg-orange-600 text-white py-3.5 px-6 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center disabled:opacity-70 mt-4"
            >
              {loading ? 'Updating SMTP Configurations...' : 'Save Configurations'}
            </button>
          </form>
        </div>

        {/* Right Column: Offer Template Section */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Job Offer Email Template</h2>
            <p className="text-gray-500 mt-1">Customize the default template text for sending job offer letters. Use <code>{"{{candidateName}}"}</code>, <code>{"{{jobPosition}}"}</code>, <code>{"{{startDate}}"}</code>, <code>{"{{salary}}"}</code>, <code>{"{{documents}}"}</code>, <code>{"{{workingHours}}"}</code>, and <code>{"{{noticePeriod}}"}</code> as placeholders.</p>
          </div>

          {templateError && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {templateError}
            </div>
          )}
          {templateSuccess && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
              {templateSuccess}
            </div>
          )}

          <form onSubmit={handleTemplateSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Email Subject</label>
              <input
                type="text"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 text-gray-900"
                placeholder="e.g. Job Offer Confirmation - Jayam Web Solutions"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Email Body</label>
              <textarea
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                required
                rows={12}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 text-gray-900 font-mono text-sm leading-relaxed"
                placeholder="Enter template text here..."
              />
            </div>

            <button
              type="submit"
              disabled={savingTemplate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center disabled:opacity-70 mt-4"
            >
              {savingTemplate ? 'Updating Template...' : 'Save Template'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
