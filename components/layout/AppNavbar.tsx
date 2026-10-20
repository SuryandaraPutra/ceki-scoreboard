'use client';

/**
 * Navigasi Atas (Navbar) untuk Tablet dan Desktop,
 * serta header ringkas di HP.
 * - Indikator aktif berupa underline/pil yang bergerak (layoutId).
 * - prefers-reduced-motion: langsung tampil tanpa animasi gerak.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Gamepad2, Users, Trophy, History, Settings } from 'lucide-react';

export function AppNavbar() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const links = [
    { label: 'Game',        href: '/',            icon: Gamepad2, isActive: pathname === '/' || pathname.startsWith('/game') },
    { label: 'Pemain',      href: '/players',     icon: Users,    isActive: pathname.startsWith('/players') },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy,   isActive: pathname.startsWith('/leaderboard') },
    { label: 'Riwayat',     href: '/history',     icon: History,  isActive: pathname.startsWith('/history') },
    { label: 'Pengaturan',  href: '/settings',    icon: Settings, isActive: pathname.startsWith('/settings') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Judul */}
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-emerald-500/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-center p-0.5">
            <img
              src="/logo.png"
              alt="Logo KOCOK KEKAR"
              className="w-full h-full object-contain rounded-xl"
            />
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

        {/* Links untuk Desktop & Tablet dengan animated active indicator */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-colors duration-150 ${
                  link.isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {/* Background pil aktif — bergerak mulus antar link */}
                {link.isActive && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 400,
                            damping: 32,
                            mass: 0.7,
                          }
                    }
                  />
                )}
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
