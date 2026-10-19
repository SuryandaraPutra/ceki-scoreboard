'use client';

/**
 * Layout pembungkus utama aplikasi:
 * Mengintegrasikan Navbar, Bottom Navigation, Banner Offline,
 * Toaster notifikasi, dan tema.
 */

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppNavbar } from './AppNavbar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        <OfflineBanner />
        <AppNavbar />

        {/* Konten Utama */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8">
          {children}
        </main>

        <BottomNav />
        <Toaster position="top-center" richColors closeButton />
      </div>
    </ThemeProvider>
  );
}
