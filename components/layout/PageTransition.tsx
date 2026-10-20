'use client';

/**
 * PageTransition — Pembungkus animasi transisi antar halaman.
 *
 * Menggunakan Framer Motion AnimatePresence (mode="wait") sehingga:
 * - Halaman lama keluar dulu sebelum halaman baru masuk.
 * - Tidak ada antrean animasi atau macet saat klik cepat.
 * - Arah slide berdasarkan urutan menu (kanan/kiri).
 * - prefers-reduced-motion: hanya fade 150ms tanpa gerakan.
 * - Hanya animasikan transform + opacity (GPU-composited).
 */

import React, { useContext, createContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePageDirection } from '@/hooks/usePageDirection';
import {
  TRANSITION_DURATION,
  EASING,
  SLIDE_DISTANCE,
  CARD_PERSPECTIVE,
  CARD_ROTATE_Y,
  ENTER_SCALE,
  STAGGER_DELAY,
  STAGGER_MAX_ITEMS,
} from '@/lib/transition-config';

// ─────────────────────────────────────────────
// Context untuk stagger child animations
// ─────────────────────────────────────────────

interface StaggerContextValue {
  /** Apakah stagger sedang aktif (baru selesai transisi masuk) */
  isEntering: boolean;
}

const StaggerContext = createContext<StaggerContextValue>({ isEntering: false });
export const useStaggerContext = () => useContext(StaggerContext);

// ─────────────────────────────────────────────
// Variants animasi
// ─────────────────────────────────────────────

function buildVariants(direction: 1 | -1, reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: TRANSITION_DURATION.reducedMotion } },
      exit:    { opacity: 0, transition: { duration: TRANSITION_DURATION.reducedMotion } },
    };
  }

  const xOffset = SLIDE_DISTANCE * direction;
  const xOffsetExit = SLIDE_DISTANCE * direction * -1;

  return {
    initial: {
      opacity: 0,
      x: xOffset,
      scale: ENTER_SCALE,
      rotateY: CARD_ROTATE_Y * direction,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: TRANSITION_DURATION.enter,
        ease: EASING.enter,
      },
    },
    exit: {
      opacity: 0,
      x: xOffsetExit,
      scale: ENTER_SCALE,
      rotateY: CARD_ROTATE_Y * direction * -1,
      transition: {
        duration: TRANSITION_DURATION.exit,
        ease: EASING.exit,
      },
    },
  };
}

// ─────────────────────────────────────────────
// PageTransition component
// ─────────────────────────────────────────────

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const direction = usePageDirection();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const variants = useMemo(
    () => buildVariants(direction, prefersReducedMotion),
    [direction, prefersReducedMotion]
  );

  return (
    // Container dengan perspektif untuk efek nuansa kartu
    <div
      style={{
        perspective: prefersReducedMotion ? undefined : `${CARD_PERSPECTIVE}px`,
        perspectiveOrigin: 'center center',
        // Cegah overflow horizontal saat slide
        overflowX: 'hidden',
      }}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() => {
          // Reset scroll ke atas setelah animasi keluar selesai
          // Mencegah halaman baru muncul di posisi scroll lama
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
        }}
      >
        <motion.div
          key={pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            // GPU compositing — hindari layout shift
            willChange: 'transform, opacity',
            transformStyle: 'preserve-3d',
          }}
          onAnimationComplete={() => {
            // Hapus will-change setelah animasi selesai agar tidak memakan memory GPU
            // (Framer Motion handles this automatically with motion.div, but we're explicit)
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// StaggerChild — elemen yang muncul berurutan
// ─────────────────────────────────────────────

interface StaggerChildProps {
  /** Index elemen (0-based). Max STAGGER_MAX_ITEMS. */
  index: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Bungkus kartu atau baris list dengan StaggerChild agar muncul
 * berurutan dengan jeda 30-50ms saat halaman pertama kali tampil.
 *
 * Usage:
 *   <StaggerChild index={0}><PlayerCard /></StaggerChild>
 *   <StaggerChild index={1}><PlayerCard /></StaggerChild>
 */
export function StaggerChild({ index, children, className }: StaggerChildProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const clampedIndex = Math.min(index, STAGGER_MAX_ITEMS - 1);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: EASING.enter,
        delay: clampedIndex * STAGGER_DELAY,
      }}
    >
      {children}
    </motion.div>
  );
}
