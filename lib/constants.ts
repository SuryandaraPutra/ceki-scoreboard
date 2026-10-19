/**
 * Konstanta warna pemain dan helper UI global.
 */

/** Warna tema yang tersedia untuk pemain */
export const PLAYER_COLOR_OPTIONS = [
  { label: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { label: 'Sky', value: '#0ea5e9', bg: 'bg-sky-500' },
  { label: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { label: 'Rose', value: '#f43f5e', bg: 'bg-rose-500' },
  { label: 'Violet', value: '#8b5cf6', bg: 'bg-violet-500' },
  { label: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { label: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
  { label: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
];

/** Preset nilai cepat default */
export const DEFAULT_QUICK_VALUES = [1, 5, 10, 20];

/** Preset nilai cepat yang bisa dipilih */
export const QUICK_VALUE_PRESETS = [1, 2, 5, 10, 20, 25, 50, 100];

/** Preset batas skor */
export const SCORE_LIMIT_PRESETS = [50, 100, 200, 500, 1000];

/** Pesan konfirmasi standar */
export const CONFIRM_MESSAGES = {
  deletePlayer: 'Apakah Anda yakin ingin menghapus/mengarsipkan pemain ini?',
  deleteGame: 'Apakah Anda yakin ingin menghapus game ini? Data tidak bisa dikembalikan.',
  deleteRound: 'Hapus round ini?',
  finishGame: 'Akhiri game sekarang?',
  newGameWhileActive: 'Masih ada game yang sedang berjalan. Pilih tindakan:',
  resetData: 'Tindakan ini akan menghapus SEMUA data. Ketik "HAPUS SEMUA" untuk konfirmasi.',
  importReplace: 'Mode "Ganti Semua" akan menghapus seluruh data yang ada. Lanjutkan?',
};

/** Status warna progress bar */
export function getProgressColor(progress: number): string {
  if (progress >= 1) return 'bg-rose-500';
  if (progress >= 0.8) return 'bg-amber-400';
  return 'bg-emerald-500';
}

/** Format tanggal dalam Bahasa Indonesia */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format tanggal + waktu */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Vibrasi ringan di HP (jika didukung dan diaktifkan pengguna) */
export function vibrate(pattern: number | number[] = 50): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** Cek apakah browser mendukung Web Share API */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/** Salin teks ke clipboard atau share via Web Share API */
export async function shareOrCopy(text: string, title = 'KOCOK KEKAR'): Promise<boolean> {
  if (canShare()) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      // User membatalkan atau tidak didukung
    }
  }

  // Fallback ke clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
