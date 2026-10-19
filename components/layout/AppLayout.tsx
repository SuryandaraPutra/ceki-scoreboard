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
      <div className="min-h-screen flex flex-col relative text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        {/* Layer Foto Latar Belakang (Wallpaper Samurai Kocok Kekar) */}
        <div
          className="fixed inset-0 z-0 bg-cover bg-top sm:bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />

        {/* Layer Overlay Ambien untuk Keterbacaan Teks & Kontras */}
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-white/70 dark:bg-slate-950/80 backdrop-blur-[1px]"
        />

        <div className="relative z-10 flex flex-col min-h-screen">
          <OfflineBanner />
          <AppNavbar />

          {/* Konten Utama */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8">
            {children}
          </main>

          <BottomNav />
        </div>

        <Toaster position="top-center" richColors closeButton />
      </div>
    </ThemeProvider>
  );
}
