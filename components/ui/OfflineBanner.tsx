'use client';

/**
 * Banner notifikasi saat koneksi internet / server terputus.
 */

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg animate-slide-up">
      <WifiOff size={16} className="shrink-0 animate-pulse" />
      <span>Tidak terhubung ke server. Tombol simpan dinonaktifkan sementara.</span>
    </div>
  );
}
