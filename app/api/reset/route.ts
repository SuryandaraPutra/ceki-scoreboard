/**
 * API Route: /api/reset
 * POST: Menghapus seluruh data aplikasi (hanya jalan jika konfirmasi diketik "HAPUS SEMUA")
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  games,
  gamePlayers,
  players,
  rounds,
  roundScores,
  settings,
} from '@/lib/schema';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { confirmation } = body;

    // Wajib konfirmasi ketik persis "HAPUS SEMUA"
    if (confirmation !== 'HAPUS SEMUA') {
      return makeError(
        'CONFIRMATION_MISMATCH',
        'Kata konfirmasi tidak sesuai. Ketik "HAPUS SEMUA" untuk mereset seluruh data.',
        400
      );
    }

    // Hapus semua data tabel game dan pemain
    await db.delete(roundScores);
    await db.delete(rounds);
    await db.delete(gamePlayers);
    await db.delete(games);
    await db.delete(players);

    // Reset settings ke default
    const existing = await db.select({ id: settings.id }).from(settings).limit(1);
    if (existing.length > 0) {
      await db
        .update(settings)
        .set({
          ...DEFAULT_SETTINGS,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(settings.id, existing[0].id));
    }

    return NextResponse.json({
      message: 'Seluruh data game, pemain, dan pengaturan berhasil direset',
    });
  } catch (error) {
    console.error('Error in POST /api/reset:', error);
    return makeError('INTERNAL_ERROR', 'Gagal mereset data', 500);
  }
}
