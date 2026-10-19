'use client';

/**
 * Halaman Offline ramah pengguna saat koneksi internet terputus.
 */

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto my-12 p-8 glass-card text-center flex flex-col items-center gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center animate-pulse">
        <WifiOff size={32} />
      </div>

      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Sedang Offline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Koneksi internet atau sambungan ke server Ceki Scoreboard terputus.
          Silakan periksa koneksi Wi-Fi atau data seluler Anda.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
        <button
          onClick={() => window.location.reload()}
          className="btn-primary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={16} />
          <span>Coba Muat Ulang</span>
        </button>

        <Link
          href="/"
          className="btn-secondary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Home size={16} />
          <span>Ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
