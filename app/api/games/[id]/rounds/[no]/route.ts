/**
 * API Route: /api/games/[id]/rounds/[no]
 * PUT: Mengubah nilai skor pada round tertentu
 * DELETE: Menghapus round (Undo round terakhir atau hapus round di tengah)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamePlayers, rounds, roundScores } from '@/lib/schema';
import { UpdateRoundSchema, makeError } from '@/lib/validations';
import { getOrCreateSettings } from '@/lib/settings';
import { getGameFullData } from '@/lib/game-queries';
import { checkScoreLimit } from '@/lib/calc';
import { eq, and, sql, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: { id: string; no: string };
}

/**
 * PUT /api/games/[id]/rounds/[no]
 * Edit skor pada round yang sudah ada
 */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const gameId = parseInt(params.id, 10);
    const roundNo = parseInt(params.no, 10);

    if (isNaN(gameId) || isNaN(roundNo)) {
      return makeError('INVALID_ID', 'ID game atau nomor round tidak valid', 400);
    }

    const body = await req.json();
    const parsed = UpdateRoundSchema.safeParse(body);

    if (!parsed.success) {
      return makeError(
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message ?? 'Data round tidak valid',
        400
      );
    }

    // Ambil game
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!game) {
      return makeError('NOT_FOUND', 'Game tidak ditemukan', 404);
    }

    // Cari round berdasarkan roundNo
    const [existingRound] = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.roundNo, roundNo)))
      .limit(1);

    if (!existingRound) {
      return makeError('NOT_FOUND', `Round ${roundNo} tidak ditemukan`, 404);
    }

    // Validasi peserta
    const gpRows = await db
      .select({ playerId: gamePlayers.playerId })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));

    const gamePlayerIds = new Set(gpRows.map((r) => r.playerId));
    const rawScores = parsed.data.scores;
    const scoresNumeric: Record<number, number> = {};

    for (const [pidStr, score] of Object.entries(rawScores)) {
      const pid = parseInt(pidStr, 10);
      if (!gamePlayerIds.has(pid)) {
        return makeError(
          'INVALID_PLAYER',
          `Pemain ID ${pid} bukan peserta dalam game ini`,
          400
        );
      }
      scoresNumeric[pid] = score;
    }

    // Batasan skor
    const appSettings = await getOrCreateSettings();
    for (const score of Object.values(scoresNumeric)) {
      if (score < appSettings.roundScoreMin || score > appSettings.roundScoreMax) {
        return makeError(
          'SCORE_OUT_OF_BOUNDS',
          `Skor pemain harus berada di antara ${appSettings.roundScoreMin} dan ${appSettings.roundScoreMax}`,
          400
        );
      }
    }

    // Mode zero-sum
    if (game.zeroSum) {
      const total = Object.values(scoresNumeric).reduce((a, b) => a + b, 0);
      if (total !== 0) {
        return makeError(
          'ZERO_SUM_VIOLATION',
          `Total skor round adalah ${total > 0 ? '+' : ''}${total}. Pada mode zero-sum, total harus 0.`,
          400
        );
      }
    }

    // Update setiap skor di round_scores
    for (const [pid, score] of Object.entries(scoresNumeric)) {
      await db
        .update(roundScores)
        .set({ score })
        .where(
          and(
            eq(roundScores.roundId, existingRound.id),
            eq(roundScores.playerId, parseInt(pid, 10))
          )
        );
    }

    // Ambil data terbaru
    const fullData = await getGameFullData(
      gameId,
      game.initialScore,
      game.winCondition as 'highest' | 'lowest'
    );

    const limitReachedPlayerIds = checkScoreLimit(
      fullData.scores,
      game.scoreLimit
    );

    return NextResponse.json({
      message: `Round ${roundNo} berhasil diperbarui`,
      updatedGameScores: fullData.scores,
      hasReachedScoreLimit: limitReachedPlayerIds.length > 0,
      playersReachedLimit: limitReachedPlayerIds,
    });
  } catch (error) {
    console.error('Error in PUT /api/games/[id]/rounds/[no]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memperbarui round', 500);
  }
}

/**
 * DELETE /api/games/[id]/rounds/[no]
 * Hapus round. Jika yang dihapus di tengah, renumber round berikutnya agar urut.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const gameId = parseInt(params.id, 10);
    const roundNo = parseInt(params.no, 10);

    if (isNaN(gameId) || isNaN(roundNo)) {
      return makeError('INVALID_ID', 'ID game atau nomor round tidak valid', 400);
    }

    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!game) {
      return makeError('NOT_FOUND', 'Game tidak ditemukan', 404);
    }

    // Cari round
    const [roundToDelete] = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.roundNo, roundNo)))
      .limit(1);

    if (!roundToDelete) {
      return makeError('NOT_FOUND', `Round ${roundNo} tidak ditemukan`, 404);
    }

    // Hapus round (cascade ke round_scores)
    await db.delete(rounds).where(eq(rounds.id, roundToDelete.id));

    // Renumber round-round setelahnya: roundNo = roundNo - 1
    await db
      .update(rounds)
      .set({
        roundNo: sql`${rounds.roundNo} - 1`,
        updatedAt: sql`(unixepoch())`,
      })
      .where(and(eq(rounds.gameId, gameId), gt(rounds.roundNo, roundNo)));

    // Ambil data terbaru
    const fullData = await getGameFullData(
      gameId,
      game.initialScore,
      game.winCondition as 'highest' | 'lowest'
    );

    const limitReachedPlayerIds = checkScoreLimit(
      fullData.scores,
      game.scoreLimit
    );

    return NextResponse.json({
      message: `Round ${roundNo} berhasil dihapus`,
      updatedGameScores: fullData.scores,
      hasReachedScoreLimit: limitReachedPlayerIds.length > 0,
      playersReachedLimit: limitReachedPlayerIds,
    });
  } catch (error) {
    console.error('Error in DELETE /api/games/[id]/rounds/[no]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal menghapus round', 500);
  }
}
