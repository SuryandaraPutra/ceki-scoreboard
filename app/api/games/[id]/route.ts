/**
 * API Route: /api/games/[id]
 * GET: Mengambil detail satu game tertentu (aktif atau selesai)
 * PATCH: Mengubah pengaturan game yang sedang berjalan (nama, batas skor, aksi, zero-sum)
 * DELETE: Menghapus game beserta seluruh round dan skornya
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/schema';
import { getGameFullData } from '@/lib/game-queries';
import { checkScoreLimit, calculateProgress, parseQuickValues } from '@/lib/calc';
import { PatchGameSchema, makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: { id: string };
}

/**
 * GET /api/games/[id]
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID game tidak valid', 400);
    }

    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);

    if (!game) {
      return makeError('NOT_FOUND', 'Game tidak ditemukan', 404);
    }

    const fullData = await getGameFullData(
      game.id,
      game.initialScore,
      game.winCondition as 'highest' | 'lowest'
    );

    const reachedLimitPlayerIds = checkScoreLimit(
      fullData.scores,
      game.scoreLimit
    );

    const playersWithScores = fullData.playerIds.map((pid, seatOrder) => {
      const calc = fullData.scores.find((s) => s.playerId === pid)!;
      const progress = calculateProgress(
        calc.totalScore,
        game.initialScore,
        game.scoreLimit
      );

      return {
        id: pid,
        name: fullData.playerNames[pid],
        color: fullData.playerColors[pid],
        photoVersion: fullData.playerPhotoVersions[pid],
        seatOrder,
        totalScore: calc.totalScore,
        rank: calc.rank,
        roundScores: calc.roundScores,
        progress: Math.min(progress, 1),
        hasReachedLimit: reachedLimitPlayerIds.includes(pid),
      };
    });

    const quickValues = parseQuickValues(game.quickValues);

    return NextResponse.json({
      data: {
        id: game.id,
        name: game.name,
        status: game.status,
        winCondition: game.winCondition,
        initialScore: game.initialScore,
        scoreLimit: game.scoreLimit,
        scoreLimitAction: game.scoreLimitAction,
        zeroSum: Boolean(game.zeroSum),
        quickValues,
        targetRounds: game.targetRounds,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
        createdAt: game.createdAt,
        players: playersWithScores,
        rounds: fullData.rounds,
        hasReachedScoreLimit: reachedLimitPlayerIds.length > 0,
        playersReachedLimit: reachedLimitPlayerIds,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/games/[id]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat detail game', 500);
  }
}

/**
 * PATCH /api/games/[id]
 * Ubah nama, batas skor, aksi batas skor, atau opsi zero-sum
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID game tidak valid', 400);
    }

    const body = await req.json();
    const parsed = PatchGameSchema.safeParse(body);

    if (!parsed.success) {
      return makeError(
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message ?? 'Data yang dikirim tidak valid',
        400
      );
    }

    const [existing] = await db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);

    if (!existing) {
      return makeError('NOT_FOUND', 'Game tidak ditemukan', 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: sql`(unixepoch())`,
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name || null;
    if (parsed.data.scoreLimit !== undefined) updateData.scoreLimit = parsed.data.scoreLimit;
    if (parsed.data.scoreLimitAction !== undefined) updateData.scoreLimitAction = parsed.data.scoreLimitAction;
    if (parsed.data.zeroSum !== undefined) updateData.zeroSum = parsed.data.zeroSum;

    const [updated] = await db
      .update(games)
      .set(updateData)
      .where(eq(games.id, id))
      .returning();

    return NextResponse.json({
      data: updated,
      message: 'Pengaturan game berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error in PATCH /api/games/[id]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memperbarui game', 500);
  }
}

/**
 * DELETE /api/games/[id]
 * Hapus game beserta seluruh data round dan skornya
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID game tidak valid', 400);
    }

    const [existing] = await db
      .select({ id: games.id, name: games.name })
      .from(games)
      .where(eq(games.id, id))
      .limit(1);

    if (!existing) {
      return makeError('NOT_FOUND', 'Game tidak ditemukan', 404);
    }

    await db.delete(games).where(eq(games.id, id));

    return NextResponse.json({
      message: 'Game berhasil dihapus',
    });
  } catch (error) {
    console.error('Error in DELETE /api/games/[id]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal menghapus game', 500);
  }
}
