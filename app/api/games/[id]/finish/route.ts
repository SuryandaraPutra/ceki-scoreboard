/**
 * API Route: /api/games/[id]/finish
 * POST: Mengakhiri game, menentukan pemenang, dan menghasilkan teks ringkasan untuk dibagikan
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { getGameFullData } from '@/lib/game-queries';
import { determineWinners, formatGameSummary } from '@/lib/calc';
import { makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: { id: string };
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const gameId = parseInt(params.id, 10);
    if (isNaN(gameId)) {
      return makeError('INVALID_ID', 'ID game tidak valid', 400);
    }

    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!game) {
      return makeError('NOT_FOUND', 'Game tidak ditemukan', 404);
    }

    const now = Math.floor(Date.now() / 1000);

    // Update status game menjadi 'finished'
    await db
      .update(games)
      .set({
        status: 'finished',
        finishedAt: now,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(games.id, gameId));

    // Ambil data lengkap untuk hasil akhir
    const fullData = await getGameFullData(
      gameId,
      game.initialScore,
      game.winCondition as 'highest' | 'lowest'
    );

    const winners = determineWinners(fullData.scores);

    // Siapkan teks ringkasan siap kirim ke WhatsApp
    const summaryText = formatGameSummary(
      game.name,
      fullData.scores,
      new Date(now * 1000)
    );

    return NextResponse.json({
      data: {
        gameId,
        gameName: game.name,
        finishedAt: now,
        scores: fullData.scores,
        winners,
        summaryText,
      },
      message: 'Game berhasil diselesaikan',
    });
  } catch (error) {
    console.error('Error in POST /api/games/[id]/finish:', error);
    return makeError('INTERNAL_ERROR', 'Gagal mengakhiri game', 500);
  }
}
