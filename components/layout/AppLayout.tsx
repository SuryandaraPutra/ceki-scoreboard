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
        {/* Latar Belakang Foto Kasino User (Jernih & Terlihat Jelas) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src="/casino_vip_table.jpg?v=4"
            alt="Latar Kasino VIP"
            className="w-full h-full object-cover object-center select-none"
          />
          {/* Soft vignette & gradient overlay agar teks tetap berposisi sempurna & mudah terbaca */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/65" />
        </div>

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
