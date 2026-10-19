'use client';

/**
 * Tombol pengubah tema (Dark Mode / Light Mode).
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="btn-icon text-slate-600 dark:text-slate-300 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/70 shadow-sm"
      aria-label="Ubah tema"
      title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
    >
      {isDark ? (
        <Sun size={20} className="text-amber-400 hover:rotate-90 transition-transform duration-300" />
      ) : (
        <Moon size={20} className="text-slate-700 hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
