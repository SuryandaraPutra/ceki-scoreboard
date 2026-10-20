'use client';

/**
 * Hook: usePageDirection
 *
 * Mendeteksi arah navigasi (1 = maju/kanan, -1 = mundur/kiri)
 * berdasarkan urutan halaman di PAGE_ORDER.
 *
 * Digunakan oleh PageTransition untuk menentukan arah slide.
 */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PAGE_ORDER } from '@/lib/transition-config';

/** Normalisasi pathname ke key urutan halaman */
function getPageIndex(pathname: string): number {
  // Cari urutan paling spesifik dulu (bukan '/' catch-all)
  for (let i = PAGE_ORDER.length - 1; i >= 0; i--) {
    const route = PAGE_ORDER[i];
    if (route === '/') continue; // handle terakhir
    if (pathname.startsWith(route)) return i;
  }
  // Halaman game aktif & sub-route '/'
  if (pathname === '/' || pathname.startsWith('/game')) return 0;
  return -1; // rute di luar urutan, tidak ada arah
}

export function usePageDirection() {
  const pathname = usePathname();
  const prevIndexRef = useRef<number>(-1);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const currentIndex = getPageIndex(pathname);
    const prevIndex = prevIndexRef.current;

    if (prevIndex !== -1 && currentIndex !== -1) {
      setDirection(currentIndex >= prevIndex ? 1 : -1);
    }

    prevIndexRef.current = currentIndex;
  }, [pathname]);

  return direction;
}
