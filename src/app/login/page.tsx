"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Static mock login credentials for now
    if (username === 'admin' && password === 'admin123') {
      // In a real application, you would set a secure HTTP-only cookie here.
      // For now, we will simply redirect to the admin dashboard.
      router.push('/jayam-admin/categories');
    } else {
      setError('Invalid username or password. (Hint: admin / admin123)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Image 
          src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/logo1.png`} 
          alt="Jayam Web Solutions" 
          width={240} 
          height={60} 
          className="h-16 w-auto object-contain mb-6" 
          priority
        />
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Admin Portal Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Authorized personnel only.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100 animate-in fade-in">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ff6600] focus:border-[#ff6600] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ff6600] focus:border-[#ff6600] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ff6600] hover:bg-[#e65c00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6600] transition-colors"
              >
                Sign In to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
