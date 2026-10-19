'use client';

/**
 * Hook untuk menjaga layar HP/tablet tetap menyala (Screen Wake Lock API)
 * saat sedang berada di halaman permainan aktif.
 */

import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    let isCancelled = false;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Browser mungkin menolak (misalnya baterai lemah), abaikan secara graceful
      }
    }

    requestWakeLock();

    // Minta kembali wake lock jika pengguna berpindah tab lalu kembali lagi
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCancelled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}
