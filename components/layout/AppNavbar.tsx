'use client';

/**
 * Navigasi Atas (Navbar) untuk Tablet dan Desktop,
 * serta header ringkas di HP.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Gamepad2, Users, Trophy, History, Settings, Sparkles } from 'lucide-react';

export function AppNavbar() {
  const pathname = usePathname();

  const links = [
    { label: 'Game', href: '/', icon: Gamepad2, isActive: pathname === '/' || pathname.startsWith('/game') },
    { label: 'Pemain', href: '/players', icon: Users, isActive: pathname.startsWith('/players') },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, isActive: pathname.startsWith('/leaderboard') },
    { label: 'Riwayat', href: '/history', icon: History, isActive: pathname.startsWith('/history') },
    { label: 'Pengaturan', href: '/settings', icon: Settings, isActive: pathname.startsWith('/settings') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Judul */}
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles size={20} className="animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 dark:from-emerald-400 dark:via-teal-400 dark:to-sky-400 bg-clip-text text-transparent">
              KOCOK KEKAR
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase -mt-1 hidden sm:block">
              4-Pemain Kartu Ceki
            </span>
          </div>
        </Link>

        {/* Links untuk Desktop & Tablet */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                  link.isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls: Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
