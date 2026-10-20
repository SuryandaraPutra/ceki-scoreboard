/**
 * ─────────────────────────────────────────────────────────────
 * TRANSITION CONFIG — satu file untuk atur semua animasi halaman
 * Ubah nilai di sini untuk menyesuaikan feel transisi seluruh app.
 * ─────────────────────────────────────────────────────────────
 */

/** Urutan halaman — menentukan arah slide (kiri/kanan) */
export const PAGE_ORDER = ['/', '/players', '/leaderboard', '/history', '/settings'] as const;
export type PagePath = (typeof PAGE_ORDER)[number];

/** Durasi animasi (detik) */
export const TRANSITION_DURATION = {
  /** Konten halaman masuk */
  enter: 0.35,
  /** Konten halaman keluar */
  exit: 0.22,
  /** Efek reduced-motion (hanya fade) */
  reducedMotion: 0.15,
} as const;

/** Easing curves */
export const EASING = {
  /** Masuk — decelerate: terasa "landing" yang mulus */
  enter: [0.22, 1, 0.36, 1] as const,
  /** Keluar — accelerate: cepat pergi, tidak menunggu */
  exit: [0.4, 0, 1, 1] as const,
} as const;

/**
 * Jarak slide horizontal (px).
 * Kecil saja agar tidak terasa berlebihan di HP.
 */
export const SLIDE_DISTANCE = 28;

/**
 * Perspektif (px) untuk efek nuansa kartu.
 * Diterapkan ke container parent.
 */
export const CARD_PERSPECTIVE = 1200;

/**
 * Rotasi Y (derajat) untuk efek flip kartu halus.
 * Gunakan 0 untuk menonaktifkan efek ini.
 */
export const CARD_ROTATE_Y = 4;

/** Skala awal saat konten masuk */
export const ENTER_SCALE = 0.97;

/**
 * Stagger delay antar elemen dalam satu halaman (detik).
 * Maksimal STAGGER_MAX_ITEMS elemen yang di-stagger.
 */
export const STAGGER_DELAY = 0.04;
export const STAGGER_MAX_ITEMS = 8;
