"use client"
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchAllCategories } from '../lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchAllCategories();
        if (res.success) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed to load navbar categories", err);
      }
    };
    loadCategories();
  }, []);

  const isActive = (path) => pathname === path;
  const isJobActive = pathname?.startsWith('/job');

  const toggleDropdown = (name) => {
    setMobileDropdown(mobileDropdown === name ? null : name);
  };
  const createSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const activeCategories = categories.filter(c => c.isActive);
  return (
    <nav className="relative z-50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-8 py-2">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/logo.png`}
              alt="Jayam Web Solutions"
              width={240}
              height={60}
              className="h-10 sm:h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>
        {/* Mobile Hamburger Button */}
        <button 
          className="lg:hidden p-2 text-gray-600 hover:text-[#ff7800] focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center justify-center space-x-10 text-sm font-bold text-gray-700 h-16 absolute left-1/2 transform -translate-x-1/2 w-max">
          <Link 
            href="/" 
            className={`transition-colors ${isActive('/') ? 'text-[#ff7800]' : 'hover:text-[#ff7800]'}`}
          >
            Home
          </Link>
          {/* Apply For Dropdown (All Categories) */}
          <div className="relative group cursor-pointer h-full flex items-center">
            <span className="flex items-center transition-colors group-hover:text-[#ff7800]">
              Job Categories
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </span>
            <div className="absolute top-full left-0 hidden group-hover:block w-48 bg-white border border-gray-200 shadow-lg z-50">
              <ul className="flex flex-col text-gray-500 text-sm font-medium">
                {categories.length === 0 ? (
                  <li className="px-4 py-2.5 text-gray-400">No categories found</li>
                ) : (
                  categories.map(cat => {
                    const slug = `/job/${createSlug(cat.name)}`;
                    return (
                      <li key={cat._id} className="border-b border-gray-100 hover:text-[#ff7800] hover:bg-gray-50">
                        <Link href={slug} className={`block px-4 py-2.5 ${pathname === slug ? 'text-[#ff7800]' : ''}`}>
                          {cat.name}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
          {/* Current Openings Dropdown (Active Categories Only) */}
          <div className="relative group cursor-pointer h-full flex items-center">
            <span className="flex items-center transition-colors group-hover:text-[#ff7800]">
              Current Openings
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </span>
            <div className="absolute top-full left-0 hidden group-hover:block w-48 bg-white border border-gray-200 shadow-lg z-50">
              <ul className="flex flex-col text-gray-500 text-sm font-medium">
                {activeCategories.length === 0 ? (
                  <li className="px-4 py-2.5 text-gray-400">No current openings</li>
                ) : (
                  activeCategories.map(cat => {
                    const slug = `/job/${createSlug(cat.name)}`;
                    return (
                      <li key={`active-${cat._id}`} className="border-b border-gray-100 hover:text-[#ff7800] hover:bg-gray-50">
                        <Link href={slug} className={`block px-4 py-2.5 ${pathname === slug ? 'text-[#ff7800]' : ''}`}>
                          {cat.name}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
          <Link 
            href="/blog" 
            className={`transition-colors ${isActive('/blog') ? 'text-[#ff7800]' : 'hover:text-[#ff7800]'}`}
          >
            Blog
          </Link>
          <Link 
            href="https://jayamwebsolutions.com/contact.php" 
            className={`transition-colors ${isActive('/contact') ? 'text-[#ff7800]' : 'hover:text-[#ff7800]'}`}
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg pb-4">
          <div className="flex flex-col px-4 py-2 space-y-1 text-sm font-bold text-gray-700">
            <Link 
              href="/" 
              className={`block px-4 py-3 rounded-md ${isActive('/') ? 'text-[#ff7800] bg-orange-50' : 'hover:bg-gray-50'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>            
            {/* Mobile Apply For */}
            <div>
              <button 
                className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-gray-50"
                onClick={() => toggleDropdown('apply')}
              >
                Job Categories
                <svg className={`w-4 h-4 transform transition-transform ${mobileDropdown === 'apply' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {mobileDropdown === 'apply' && (
                <div className="flex flex-col pl-8 pr-4 py-2 space-y-1 font-medium text-gray-500">
                  {categories.map(cat => {
                    const slug = `/job/${createSlug(cat.name)}`;
                    return (
                      <Link key={cat._id} href={slug} onClick={() => setIsMobileMenuOpen(false)} className={`block py-2 ${pathname === slug ? 'text-[#ff7800]' : ''}`}>
                        {cat.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Mobile Current Openings */}
            <div>
              <button 
                className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-gray-50"
                onClick={() => toggleDropdown('openings')}
              >
                Current Openings
                <svg className={`w-4 h-4 transform transition-transform ${mobileDropdown === 'openings' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {mobileDropdown === 'openings' && (
                <div className="flex flex-col pl-8 pr-4 py-2 space-y-1 font-medium text-gray-500">
                  {activeCategories.map(cat => {
                    const slug = `/job/${createSlug(cat.name)}`;
                    return (
                      <Link key={`active-${cat._id}`} href={slug} onClick={() => setIsMobileMenuOpen(false)} className={`block py-2 ${pathname === slug ? 'text-[#ff7800]' : ''}`}>
                        {cat.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link 
              href="/blog" 
              className={`block px-4 py-3 rounded-md ${isActive('/blog') ? 'text-[#ff7800] bg-orange-50' : 'hover:bg-gray-50'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="https://jayamwebsolutions.com/contact.php" 
              className={`block px-4 py-3 rounded-md ${isActive('/contact') ? 'text-[#ff7800] bg-orange-50' : 'hover:bg-gray-50'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
