/**
 * API Route: /api/rooms
 * GET: Mengambil daftar room (meja) beserta status aktif/kosong,
 *      pemain yang sedang bermain, dan info round saat ini.
 */

import { NextResponse } from 'next/server';
import { db, ensureDbReady } from '@/lib/db';
import { games, gamePlayers, players, rounds, roundScores } from '@/lib/schema';
import { calculateScores } from '@/lib/calc';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Daftar room default
const DEFAULT_ROOMS = [
  { id: '1', name: 'Meja 1' },
  { id: '2', name: 'Meja 2' },
  { id: '3', name: 'Meja 3' },
  { id: '4', name: 'Meja 4' },
];

export async function GET() {
  try {
    await ensureDbReady();
    // Ambil semua game yang berstatus 'active'
    const activeGames = await db
      .select()
      .from(games)
      .where(eq(games.status, 'active'));

    const activeGameIds = activeGames.map((g) => g.id);

    // Ambil data pemain dan skor jika ada game aktif
    let gpRows: Array<{
      gameId: number;
      playerId: number;
      seatOrder: number;
      playerName: string;
      playerColor: string;
      photoVersion: number;
    }> = [];

    let rsRows: Array<{
      gameId: number;
      roundNo: number;
      playerId: number;
      score: number;
    }> = [];

    if (activeGameIds.length > 0) {
      gpRows = await db
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
        .where(inArray(gamePlayers.gameId, activeGameIds));

      rsRows = await db
        .select({
          gameId: rounds.gameId,
          roundNo: rounds.roundNo,
          playerId: roundScores.playerId,
          score: roundScores.score,
        })
        .from(rounds)
        .innerJoin(roundScores, eq(roundScores.roundId, rounds.id))
        .where(inArray(rounds.gameId, activeGameIds));
    }

    // Bangun daftar room
    // Sertakan default rooms dan room lain yang mungkin ada game aktifnya
    const roomMap = new Map<string, { id: string; name: string }>();
    DEFAULT_ROOMS.forEach((r) => roomMap.set(r.id, r));
    activeGames.forEach((g) => {
      const roomId = g.room || '1';
      if (!roomMap.has(roomId)) {
        roomMap.set(roomId, { id: roomId, name: `Meja ${roomId}` });
      }
    });

    const roomList = Array.from(roomMap.values()).map((room) => {
      const activeGame = activeGames.find((g) => (g.room || '1') === room.id);

      if (!activeGame) {
        return {
          id: room.id,
          name: room.name,
          status: 'empty' as const,
          activeGame: null,
        };
      }

      // Hitung skor pemain di game aktif ini
      const gPlayers = gpRows
        .filter((gp) => gp.gameId === activeGame.id)
        .sort((a, b) => a.seatOrder - b.seatOrder);

      const pIds = gPlayers.map((p) => p.playerId);
      const pNames: Record<number, string> = {};
      for (const p of gPlayers) pNames[p.playerId] = p.playerName;

      const roundMap = new Map<number, { roundNo: number; scores: Record<number, number> }>();
      const gameRs = rsRows.filter((rs) => rs.gameId === activeGame.id);
      for (const rs of gameRs) {
        if (!roundMap.has(rs.roundNo)) {
          roundMap.set(rs.roundNo, { roundNo: rs.roundNo, scores: {} });
        }
        roundMap.get(rs.roundNo)!.scores[rs.playerId] = rs.score;
      }

      const calculated = calculateScores(
        pIds,
        pNames,
        activeGame.initialScore,
        [...roundMap.values()],
        activeGame.winCondition as 'highest' | 'lowest'
      );

      return {
        id: room.id,
        name: room.name,
        status: 'active' as const,
        activeGame: {
          id: activeGame.id,
          name: activeGame.name,
          startedAt: activeGame.startedAt,
          scoreLimit: activeGame.scoreLimit,
          roundCount: roundMap.size,
          players: gPlayers.map((gp) => {
            const calc = calculated.find((c) => c.playerId === gp.playerId);
            return {
              id: gp.playerId,
              name: gp.playerName,
              color: gp.playerColor,
              totalScore: calc?.totalScore ?? activeGame.initialScore,
              rank: calc?.rank ?? 1,
            };
          }),
        },
      };
    });

    return NextResponse.json({ data: roomList });
  } catch (error) {
    console.error('Error in GET /api/rooms:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Gagal memuat status room' } },
      { status: 500 }
    );
  }
}

