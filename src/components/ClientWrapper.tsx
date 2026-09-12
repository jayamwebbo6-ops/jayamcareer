"use client"
import { usePathname } from 'next/navigation';

export default function ClientWrapper({ 
  children, 
  navbar, 
  footer 
}: { 
  children: React.ReactNode, 
  navbar: React.ReactNode, 
  footer: React.ReactNode 
}) {
  const pathname = usePathname();
  const isAdminOrLogin = pathname?.startsWith('/jayam-admin') || pathname === '/login';

  return (
    <>
      {!isAdminOrLogin && navbar}
      <main className={`w-full ${isAdminOrLogin ? 'h-screen overflow-hidden' : 'flex-1'}`}>
        {children}
      </main>
      {!isAdminOrLogin && footer}
    </>
  );
}
