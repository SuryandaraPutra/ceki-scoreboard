/**
 * API Route: /api/games/active
 * GET: Mengambil sesi game yang sedang aktif beserta seluruh pemain,
 *      riwayat round, skor terkalkulasi, dan status batas skor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbReady } from '@/lib/db';
import { games } from '@/lib/schema';
import { getGameFullData } from '@/lib/game-queries';
import { checkScoreLimit, calculateProgress, parseQuickValues } from '@/lib/calc';
import { makeError } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await ensureDbReady();
    const searchParams = req.nextUrl.searchParams;
    const room = searchParams.get('room') || '1';

    // Cari game dengan status 'active' pada room yang diminta
    const [activeGame] = await db
      .select()
      .from(games)
      .where(and(eq(games.status, 'active'), eq(games.room, room)))
      .limit(1);

    if (!activeGame) {
      return NextResponse.json({ data: null });
    }

    // Ambil data lengkap pemain, round, dan skor
    const fullData = await getGameFullData(
      activeGame.id,
      activeGame.initialScore,
      activeGame.winCondition as 'highest' | 'lowest'
    );

    // Cek batas skor
    const reachedLimitPlayerIds = checkScoreLimit(
      fullData.scores,
      activeGame.scoreLimit
    );

    // Susun data pemain dengan skor, progres, dan urutan seat
    const playersWithScores = fullData.playerIds.map((pid, seatOrder) => {
      const calc = fullData.scores.find((s) => s.playerId === pid)!;
      const progress = calculateProgress(
        calc.totalScore,
        activeGame.initialScore,
        activeGame.scoreLimit
      );

      return {
        id: pid,
        name: fullData.playerNames[pid],
        color: fullData.playerColors[pid],
        photoVersion: fullData.playerPhotoVersions[pid],
        borderId: fullData.playerBorderIds?.[pid] ?? null,
        seatOrder,
        totalScore: calc.totalScore,
        rank: calc.rank,
        roundScores: calc.roundScores,
        resetRounds: calc.resetRounds ?? [],
        wasResetToZero: (calc.resetRounds?.length ?? 0) > 0,
        progress: Math.min(progress, 1),
        hasReachedLimit: reachedLimitPlayerIds.includes(pid),
      };
    });

    const quickValues = parseQuickValues(activeGame.quickValues);

    return NextResponse.json({
      data: {
        id: activeGame.id,
        name: activeGame.name,
        room: activeGame.room,
        status: activeGame.status,
        winCondition: activeGame.winCondition,
        initialScore: activeGame.initialScore,
        scoreLimit: activeGame.scoreLimit,
        scoreLimitAction: activeGame.scoreLimitAction,
        zeroSum: Boolean(activeGame.zeroSum),
        quickValues,
        targetRounds: activeGame.targetRounds,
        startedAt: activeGame.startedAt,
        createdAt: activeGame.createdAt,
        players: playersWithScores,
        rounds: fullData.rounds,
        roundResets: fullData.roundResets,
        hasReachedScoreLimit: reachedLimitPlayerIds.length > 0,
        playersReachedLimit: reachedLimitPlayerIds,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/games/active:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat game aktif', 500);
  }
}
