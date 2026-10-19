'use client';

/**
 * Navigasi Bawah (Bottom Navigation) untuk tampilan HP.
 * Touch target minimal 44px, safe-area inset untuk iOS.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Users, Trophy, History, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Game',
      href: '/',
      icon: Gamepad2,
      isActive: pathname === '/' || pathname.startsWith('/game'),
    },
    {
      label: 'Pemain',
      href: '/players',
      icon: Users,
      isActive: pathname.startsWith('/players'),
    },
    {
      label: 'Peringkat',
      href: '/leaderboard',
      icon: Trophy,
      isActive: pathname.startsWith('/leaderboard'),
    },
    {
      label: 'Riwayat',
      href: '/history',
      icon: History,
      isActive: pathname.startsWith('/history'),
    },
    {
      label: 'Atur',
      href: '/settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <nav className="bottom-nav sm:hidden" aria-label="Navigasi Utama HP">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item select-none active:scale-90 ${
              item.isActive ? 'active' : ''
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                item.isActive
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon size={22} strokeWidth={item.isActive ? 2.5 : 2} />
            </div>
            <span
              className={`text-[11px] font-semibold tracking-tight ${
                item.isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
