import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  const basePath = process.env.BASE_URL || '';
  
  // Protect all /jayam-admin routes EXCEPT /jayam-admin/login
  if (path.startsWith('/jayam-admin') && !path.startsWith('/jayam-admin/login')) {
    const token = request.cookies.get('jayamadmin_token')?.value;
    
    if (!token) {
      // No token found, redirect to login page
      return NextResponse.redirect(new URL(`${basePath}/jayam-admin/login`, request.url));
    }
  }

  // Redirect authenticated admins trying to access the login page
  if (path.startsWith('/jayam-admin/login')) {
    const token = request.cookies.get('jayamadmin_token')?.value;
    if (token) {
      return NextResponse.redirect(new URL(`${basePath}/jayam-admin`, request.url));
    }
  }
}

export const config = {
  matcher: ['/jayam-admin/:path*'],
};
