/**
 * API Route: /api/games
 * POST: Buat game baru dengan tepat 4 pemain
 * GET: Ambil daftar game selesai (?status=finished)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbReady } from '@/lib/db';
import { games, gamePlayers, players, rounds, roundScores } from '@/lib/schema';
import { CreateGameSchema, makeError } from '@/lib/validations';
import { getOrCreateSettings, parseQuickValues } from '@/lib/settings';
import { calculateScores } from '@/lib/calc';
import { eq, desc, sql, inArray, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/games?status=finished
 * Mengambil daftar game selesai untuk riwayat dan leaderboard.
 */
export async function GET(req: NextRequest) {
  try {
    await ensureDbReady();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'finished';
    const roomParam = searchParams.get('room');

    // Ambil game dengan status yang diminta (dan opsional filter room)
    const conditions = [eq(games.status, status)];
    if (roomParam) {
      conditions.push(eq(games.room, roomParam));
    }

    const gameList = await db
      .select()
      .from(games)
      .where(and(...conditions))
      .orderBy(desc(games.createdAt))
      .limit(50);

    if (gameList.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const gameIds = gameList.map((g) => g.id);

    // Ambil game_players untuk game-game ini
    const gpRows = await db
      .select({
        gameId: gamePlayers.gameId,
        playerId: gamePlayers.playerId,
        seatOrder: gamePlayers.seatOrder,
        playerName: players.name,
        playerColor: players.color,
        photoVersion: players.photoVersion,
      })
      .from(gamePlayers)
      .innerJoin(players, eq(players.id, gamePlayers.playerId))
      .where(inArray(gamePlayers.gameId, gameIds));

    // Ambil round_scores untuk menghitung skor akhir
    const rsRows = await db
      .select({
        gameId: rounds.gameId,
        roundNo: rounds.roundNo,
        playerId: roundScores.playerId,
        score: roundScores.score,
      })
      .from(rounds)
      .innerJoin(roundScores, eq(roundScores.roundId, rounds.id))
      .where(inArray(rounds.gameId, gameIds));

    // Susun data per game
    const result = gameList.map((game) => {
      const gPlayers = gpRows
        .filter((gp) => gp.gameId === game.id)
        .sort((a, b) => a.seatOrder - b.seatOrder);

      const pIds = gPlayers.map((p) => p.playerId);
      const pNames: Record<number, string> = {};
      for (const p of gPlayers) pNames[p.playerId] = p.playerName;

      // Kumpulkan rounds
      const roundMap = new Map<number, { roundNo: number; scores: Record<number, number> }>();
      const gameRs = rsRows.filter((rs) => rs.gameId === game.id);
      for (const rs of gameRs) {
        if (!roundMap.has(rs.roundNo)) {
          roundMap.set(rs.roundNo, { roundNo: rs.roundNo, scores: {} });
        }
        roundMap.get(rs.roundNo)!.scores[rs.playerId] = rs.score;
      }

      const calculated = calculateScores(
        pIds,
        pNames,
        game.initialScore,
        [...roundMap.values()],
        game.winCondition as 'highest' | 'lowest'
      );

      const winners = calculated.filter((p) => p.rank === 1).map((p) => p.playerId);

      return {
        id: game.id,
        name: game.name,
        room: game.room,
        status: game.status,
        winCondition: game.winCondition,
        initialScore: game.initialScore,
        scoreLimit: game.scoreLimit,
        totalRounds: roundMap.size,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
        createdAt: game.createdAt,
        players: gPlayers.map((gp) => {
          const calc = calculated.find((c) => c.playerId === gp.playerId);
          return {
            id: gp.playerId,
            name: gp.playerName,
            color: gp.playerColor,
            photoVersion: gp.photoVersion,
            seatOrder: gp.seatOrder,
            totalScore: calc?.totalScore ?? game.initialScore,
            rank: calc?.rank ?? 1,
            isWinner: winners.includes(gp.playerId),
          };
        }),
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in GET /api/games:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat daftar game', 500);
  }
}

/**
 * POST /api/games
 * Buat sesi game baru.
 * Mendukung opsi `discardActive: true` jika ingin membuang game aktif yang ada.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureDbReady();
    const body = await req.json();
    const discardActive = Boolean(body.discardActive);

    // Ambil default dari settings jika ada parameter yang kosong
    const appSettings = await getOrCreateSettings();

    const parsed = CreateGameSchema.safeParse({
      name: body.name,
      room: body.room ? String(body.room) : '1',
      playerIds: body.playerIds,
      initialScore: body.initialScore ?? appSettings.defaultInitialScore,
      winCondition: body.winCondition ?? appSettings.defaultWinCondition,
      scoreLimit:
        body.scoreLimit !== undefined
          ? body.scoreLimit
          : (appSettings.defaultScoreLimit ?? 250),
      scoreLimitAction:
        body.scoreLimitAction ?? appSettings.defaultScoreLimitAction,
      zeroSum: body.zeroSum ?? appSettings.defaultZeroSum,
      quickValues:
        body.quickValues ??
        (appSettings.defaultQuickValues
          ? parseQuickValues(appSettings.defaultQuickValues)
          : [5, 15, 25]),
      targetRounds: body.targetRounds,
    });

    if (!parsed.success) {
      return makeError(
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message ?? 'Data game tidak valid',
        400
      );
    }

    const {
      name,
      room,
      playerIds,
      initialScore,
      winCondition,
      scoreLimit,
      scoreLimitAction,
      zeroSum,
      quickValues,
      targetRounds,
    } = parsed.data;

    // Cek apakah ada game aktif yang sedang berjalan di room ini
    const [activeGame] = await db
      .select({ id: games.id, name: games.name, room: games.room })
      .from(games)
      .where(and(eq(games.status, 'active'), eq(games.room, room)))
      .limit(1);

    if (activeGame) {
      if (!discardActive) {
        return makeError(
          'ACTIVE_GAME_EXISTS',
          `Masih ada game aktif di Meja ${room} (#${activeGame.id}${activeGame.name ? ' - ' + activeGame.name : ''}). Selesaikan atau buang game tersebut terlebih dahulu.`,
          409
        );
      }

      // Pengguna memilih membuang game aktif sebelumnya di room ini
      await db
        .update(games)
        .set({
          status: 'finished',
          finishedAt: sql`(unixepoch())`,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(games.id, activeGame.id));
    }

    // Validasi bahwa ke-4 pemain ada di tabel players
    const existingPlayers = await db
      .select({ id: players.id })
      .from(players)
      .where(inArray(players.id, playerIds));

    if (existingPlayers.length !== 4) {
      return makeError(
        'PLAYER_NOT_FOUND',
        'Satu atau lebih pemain yang dipilih tidak ditemukan',
        404
      );
    }

    // Buat game baru
    const [newGame] = await db
      .insert(games)
      .values({
        name: name || null,
        status: 'active',
        room,
        winCondition,
        initialScore,
        scoreLimit: scoreLimit ?? null,
        scoreLimitAction,
        zeroSum,
        quickValues: JSON.stringify(quickValues),
        targetRounds: targetRounds ?? null,
      })
      .returning();

    // Tambahkan 4 pemain ke game_players dengan urutan seat 0..3
    const gamePlayerRows = playerIds.map((playerId, seatOrder) => ({
      gameId: newGame.id,
      playerId,
      seatOrder,
    }));

    await db.insert(gamePlayers).values(gamePlayerRows);

    return NextResponse.json(
      {
        data: newGame,
        message: 'Game baru berhasil dibuat',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/games:', error);
    return makeError('INTERNAL_ERROR', error?.message || 'Gagal membuat game baru', 500);
  }
}
