/**
 * API Route: /api/games/[id]/rounds
 * POST: Menyimpan nilai round baru ke dalam game
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamePlayers, rounds, roundScores } from '@/lib/schema';
import { CreateRoundSchema, makeError } from '@/lib/validations';
import { getOrCreateSettings } from '@/lib/settings';
import { getGameFullData } from '@/lib/game-queries';
import { checkScoreLimit, validateZeroSum } from '@/lib/calc';
import { eq, sql, max } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const gameId = parseInt(params.id, 10);
    if (isNaN(gameId)) {
      return makeError('INVALID_ID', 'ID game tidak valid', 400);
    }

    const body = await req.json();
    const parsed = CreateRoundSchema.safeParse(body);

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

    if (game.status !== 'active') {
      return makeError('GAME_FINISHED', 'Game ini sudah selesai dan tidak dapat diisi round baru', 400);
    }

    // Ambil 4 pemain dari game_players
    const gpRows = await db
      .select({ playerId: gamePlayers.playerId })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));

    const gamePlayerIds = new Set(gpRows.map((r) => r.playerId));

    // Validasi skor
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

    // Cek batasan nilai per round dari pengaturan
    const appSettings = await getOrCreateSettings();
    for (const [pid, score] of Object.entries(scoresNumeric)) {
      if (score < appSettings.roundScoreMin || score > appSettings.roundScoreMax) {
        return makeError(
          'SCORE_OUT_OF_BOUNDS',
          `Skor pemain harus berada di antara ${appSettings.roundScoreMin} dan ${appSettings.roundScoreMax}`,
          400
        );
      }
    }

    // Mode zero-sum: total skor semua pemain harus = 0
    if (game.zeroSum) {
      const totalRoundScore = Object.values(scoresNumeric).reduce((a, b) => a + b, 0);
      if (totalRoundScore !== 0) {
        return makeError(
          'ZERO_SUM_VIOLATION',
          `Total skor round adalah ${totalRoundScore > 0 ? '+' : ''}${totalRoundScore}. Pada mode zero-sum, total skor harus tepat 0.`,
          400
        );
      }
    }

    // Hitung nomor round berikutnya secara atomic
    const [maxRound] = await db
      .select({ maxNo: max(rounds.roundNo) })
      .from(rounds)
      .where(eq(rounds.gameId, gameId));

    const nextRoundNo = (maxRound?.maxNo ?? 0) + 1;

    // Masukkan data round baru
    const [newRound] = await db
      .insert(rounds)
      .values({
        gameId,
        roundNo: nextRoundNo,
      })
      .returning();

    // Masukkan skor ke round_scores
    const roundScoreRows = Object.entries(scoresNumeric).map(([pid, score]) => ({
      roundId: newRound.id,
      playerId: parseInt(pid, 10),
      score,
    }));

    await db.insert(roundScores).values(roundScoreRows);

    // Ambil data lengkap yang sudah diperbarui
    const fullData = await getGameFullData(
      gameId,
      game.initialScore,
      game.winCondition as 'highest' | 'lowest'
    );

    // Cek batas skor tertinggi
    const limitReachedPlayerIds = checkScoreLimit(
      fullData.scores,
      game.scoreLimit
    );

    let isAutoFinished = false;

    // Jika batas tercapai dan aksinya adalah 'auto', selesaikan game otomatis
    if (limitReachedPlayerIds.length > 0 && game.scoreLimitAction === 'auto') {
      await db
        .update(games)
        .set({
          status: 'finished',
          finishedAt: sql`(unixepoch())`,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(games.id, gameId));

      isAutoFinished = true;
    }

    return NextResponse.json({
      data: {
        roundNo: nextRoundNo,
        scores: scoresNumeric,
        updatedGameScores: fullData.scores,
        hasReachedScoreLimit: limitReachedPlayerIds.length > 0,
        playersReachedLimit: limitReachedPlayerIds,
        isAutoFinished,
      },
      message: `Round ${nextRoundNo} berhasil disimpan`,
    });
  } catch (error) {
    console.error('Error in POST /api/games/[id]/rounds:', error);
    return makeError('INTERNAL_ERROR', 'Gagal menyimpan round', 500);
  }
}
