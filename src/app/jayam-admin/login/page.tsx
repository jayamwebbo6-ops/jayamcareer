'use client';

import { useState } from 'react';
import { sendAdminOtp, verifyAdminOtp } from '../../../lib/api';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendAdminOtp(email);
      setSuccess('A 6-digit verification code has been sent to your email.');
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyAdminOtp(email, otp);
      router.push('/jayam-admin');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div suppressHydrationWarning className="max-w-md w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 p-10">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-500">Sign in using passwordless email OTP</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium text-center border border-green-100">
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form suppressHydrationWarning onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
              <input
                suppressHydrationWarning
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 focus:bg-white text-gray-900"
                placeholder="enteradmin@email.com"
              />
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ff7800] to-orange-500 hover:from-orange-600 hover:to-[#ff7800] text-white py-4 px-6 font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
            >
              {loading ? 'Sending OTP...' : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form suppressHydrationWarning onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="flex gap-2">
                <input
                  suppressHydrationWarning
                  type="email"
                  value={email}
                  disabled
                  className="flex-1 px-5 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setSuccess('');
                    setError('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#ff6600] hover:text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-50/50 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit OTP</label>
              <input
                suppressHydrationWarning
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] transition-all bg-gray-50 focus:bg-white text-gray-900 text-center text-2xl font-bold tracking-widest"
                placeholder="000000"
              />
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ff7800] to-orange-500 hover:from-orange-600 hover:to-[#ff7800] text-white py-4 px-6 font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
