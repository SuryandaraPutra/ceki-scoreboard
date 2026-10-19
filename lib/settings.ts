/**
 * Helper untuk mendapatkan atau membuat baris settings default di database.
 * Dipanggil dari API /api/settings.
 */

import { db } from './db';
import { settings } from './schema';

/** Nilai default settings */
export const DEFAULT_SETTINGS = {
  defaultScoreLimit: null,
  defaultScoreLimitAction: 'ask' as const,
  defaultWinCondition: 'highest' as const,
  defaultInitialScore: 0,
  defaultQuickValues: '[1,5,10,20]',
  roundScoreMin: -9999,
  roundScoreMax: 9999,
  defaultZeroSum: false,
  vibration: true,
  theme: 'system' as const,
};

/**
 * Ambil settings dari database.
 * Jika belum ada baris settings, buat dengan nilai default.
 */
export async function getOrCreateSettings() {
  const existing = await db.select().from(settings).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Buat settings default
  const [created] = await db
    .insert(settings)
    .values(DEFAULT_SETTINGS)
    .returning();

  return created;
}

/**
 * Parse quick values dari JSON string ke array number.
 */
export function parseQuickValues(jsonStr: string): number[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((v) => typeof v === 'number' && v > 0);
    }
  } catch {
    // Jika gagal parse, gunakan default
  }
  return [1, 5, 10, 20];
}
