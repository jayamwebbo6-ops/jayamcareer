'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout } from '../../lib/api';
import { useState } from 'react';
import {
  FaFolderOpen,
  FaTasks,
  FaClipboardList,
  FaBriefcase,
  FaEdit,
  FaCog,
  FaSignOutAlt,
  FaCheckCircle,
  FaEnvelope
} from 'react-icons/fa';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await adminLogout();
      router.push('/jayam-admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navLinks = [
    { href: '/jayam-admin/categories', label: 'Job Categories', icon: <FaFolderOpen /> },
    { href: '/jayam-admin/taskmanagement', label: 'Templates', icon: <FaTasks /> },
    { href: '/jayam-admin/applicationform', label: 'Form Builder', icon: <FaClipboardList /> },
    { href: '/jayam-admin/taskform', label: 'Task Form', icon: <FaClipboardList /> },
    { href: '/jayam-admin/applications', label: 'Applications', icon: <FaBriefcase /> },
    { href: '/jayam-admin/completed-tasks', label: 'Completed Tasks', icon: <FaCheckCircle /> },
    { href: '/jayam-admin/blogs', label: 'Manage Blogs', icon: <FaEdit /> },
    { href: '/jayam-admin/smtp', label: 'SMTP Settings', icon: <FaEnvelope /> },
    { href: '/jayam-admin/profile', label: 'Security & Profile', icon: <FaCog /> },
  ];

  const isLoginPage = pathname === '/jayam-admin/login' || pathname === '/jayam-admin/login/';

  if (isLoginPage) {
    return <div className="min-h-screen bg-[#f3f4f6]">{children}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f3f4f6]">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0f172a] text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff7800] to-orange-600 flex items-center justify-center font-extrabold shadow-lg shadow-orange-500/30">J</div>
          <span className="font-bold tracking-tight">Admin OS</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Premium Sidebar */}
      <aside className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 w-56 bg-[#0f172a] text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 pb-6 flex items-center gap-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff7800] to-orange-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-orange-500/30">
            J
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Admin OS</h2>
            <p className="text-xs text-white/50 font-medium">Jayam Web Solutions</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-y-auto custom-sidebar-scrollbar">
          <p className="px-4 text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Main Menu</p>

          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${isActive
                  ? 'bg-gradient-to-r from-orange-500/10 to-transparent text-[#ff7800] border-l-4 border-[#ff7800]'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                  }`}
              >
                <span className="text-xl flex items-center justify-center">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <span className="text-lg flex items-center justify-center"><FaSignOutAlt /></span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden bg-gray-50/50 relative w-full">
        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      <style>{`
        .custom-sidebar-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
        }
        .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}
