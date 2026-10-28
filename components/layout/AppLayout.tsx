'use client';

/**
 * Layout pembungkus utama aplikasi:
 * Mengintegrasikan Navbar, Bottom Navigation, Banner Offline,
 * Toaster notifikasi, tema, dan PageTransition animasi antar halaman.
 */

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppNavbar } from './AppNavbar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';
import { PageTransition } from './PageTransition';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="relative min-h-screen flex flex-col text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
        {/* Latar Belakang Kasino Realistis (White & Gold VIP High-Roller Casino Lounge) */}
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 35%, rgba(0, 0, 0, 0.28) 0%, rgba(15, 23, 42, 0.58) 55%, rgba(11, 17, 32, 0.86) 100%), url('/casino_bg.jpg')`,
            backgroundAttachment: 'fixed',
          }}
        />

        {/* Ambient Warm Golden Chandelier Glow */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle 700px at 50% 160px, rgba(245, 158, 11, 0.18), transparent 70%)',
          }}
        />

        {/* Subtle Texture Overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-repeat"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col min-h-screen">
          <OfflineBanner />

          {/* Navbar */}
          <AppNavbar />

          {/* Konten Utama */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8">
            <PageTransition>
              {children}
            </PageTransition>
          </main>

          {/* BottomNav */}
          <BottomNav />
          <Toaster position="top-center" richColors closeButton />
        </div>
      </div>
    </ThemeProvider>
  );
}
