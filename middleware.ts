/**
 * Next.js Middleware untuk Ceki Scoreboard.
 *
 * Fungsi:
 * 1. Jika APP_PIN diisi: periksa cookie PIN pada semua halaman dan API.
 *    - Halaman UI → redirect ke /pin jika belum login
 *    - API route → kembalikan 401 jika belum login
 * 2. Jika APP_PIN kosong → lewatkan semua (terbuka bebas)
 *
 * Path yang dikecualikan dari PIN check:
 * - /pin (halaman login PIN itu sendiri)
 * - /api/auth/* (endpoint untuk submit/clear PIN)
 * - /_next/* (aset internal Next.js)
 * - /favicon.ico, /manifest.json, /sw.js, /icons/*
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPinCookie, isPinRequired } from './lib/auth';

// Path yang tidak memerlukan PIN
const PUBLIC_PATHS = [
  '/pin',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/icons',
  '/offline',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  // Jika PIN tidak diaktifkan, lanjutkan langsung
  if (!isPinRequired()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // Path publik → lanjutkan tanpa cek PIN
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Cek validitas cookie PIN
  const isValid = await verifyPinCookie(req);

  if (!isValid) {
    // API route → kembalikan 401
    if (pathname.startsWith('/api/')) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Masukkan PIN untuk mengakses aplikasi' } },
        { status: 401 }
      );
    }

    // Halaman UI → redirect ke /pin dengan return URL
    const loginUrl = new URL('/pin', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware pada semua path kecuali file statis
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
