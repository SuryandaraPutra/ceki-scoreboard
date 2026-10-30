/**
 * API Route: /api/leaderboard
 * GET: Mengambil statistik leaderboard dari semua game yang selesai
 *      Parameter:
 *        ?period=all|month|week (default: all)
 *        ?sort=wins|points|winrate (default: wins)
 *      Menghasilkan daftar peringkat + kartu rekor tertinggi
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamePlayers, players, rounds, roundScores } from '@/lib/schema';
import {
  calculateScores,
  calculateLeaderboard,
  type FinishedGameData,
  type Records,
  type RecordEntry,
} from '@/lib/calc';
import { makeError } from '@/lib/validations';
import { eq, gte, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all';
    const sort = searchParams.get('sort') || 'wins';

    const now = Math.floor(Date.now() / 1000);
    let minTimestamp = 0;

    if (period === 'week') {
      minTimestamp = now - 7 * 24 * 60 * 60; // 7 hari lalu
    } else if (period === 'month') {
      minTimestamp = now - 30 * 24 * 60 * 60; // 30 hari lalu
    }

    // Query 1: Ambil semua game yang selesai dalam periode
    let finishedGamesQuery = db
      .select()
      .from(games)
      .where(eq(games.status, 'finished'));

    const finishedGames = await finishedGamesQuery;
    const filteredGames =
      minTimestamp > 0
        ? finishedGames.filter((g) => (g.finishedAt ?? 0) >= minTimestamp)
        : finishedGames;

    if (filteredGames.length === 0) {
      return NextResponse.json({
        data: {
          period,
          sort,
          leaderboard: [],
          records: {
            highestGameScore: null,
            highestRoundScore: null,
            biggestWinMargin: null,
            longestWinStreak: null,
          },
        },
      });
    }

    const gameIds = filteredGames.map((g) => g.id);

    // Query 2: Ambil semua data pemain
    const allPlayers = await db
      .select({
        id: players.id,
        name: players.name,
        color: players.color,
        photoVersion: players.photoVersion,
        borderId: players.borderId,
      })
      .from(players);

    const playerMap: Record<
      number,
      { name: string; color: string; photoVersion: number; borderId?: string | null }
    > = {};
    for (const p of allPlayers) {
      playerMap[p.id] = {
        name: p.name,
        color: p.color,
        photoVersion: p.photoVersion,
        borderId: p.borderId ?? null,
      };
    }

    // Query 3: Ambil game_players & round_scores sekaligus
    const gpRows = await db
      .select({
        gameId: gamePlayers.gameId,
        playerId: gamePlayers.playerId,
        seatOrder: gamePlayers.seatOrder,
      })
      .from(gamePlayers)
      .where(inArray(gamePlayers.gameId, gameIds));

    const rsRows = await db
      .select({
        gameId: rounds.gameId,
        roundNo: rounds.roundNo,
        playerId: roundScores.playerId,
        score: roundScores.score,
        createdAt: rounds.createdAt,
      })
      .from(rounds)
      .innerJoin(roundScores, eq(roundScores.roundId, rounds.id))
      .where(inArray(rounds.gameId, gameIds));

    // Susun data per game untuk kalkulasi leaderboard
    const finishedGameDataList: FinishedGameData[] = [];

    // Variabel untuk melacak Rekor
    let highestGameScoreRecord: RecordEntry | null = null;
    let highestRoundScoreRecord: RecordEntry | null = null;
    let biggestWinMarginRecord: RecordEntry | null = null;

    for (const g of filteredGames) {
      const gPlayers = gpRows
        .filter((gp) => gp.gameId === g.id)
        .sort((a, b) => a.seatOrder - b.seatOrder);

      const pIds = gPlayers.map((p) => p.playerId);
      const pNames: Record<number, string> = {};
      for (const p of gPlayers) {
        pNames[p.playerId] = playerMap[p.playerId]?.name ?? `Pemain ${p.playerId}`;
      }

      const roundMap = new Map<number, { roundNo: number; scores: Record<number, number> }>();
      const gRounds = rsRows.filter((rs) => rs.gameId === g.id);

      for (const rs of gRounds) {
        if (!roundMap.has(rs.roundNo)) {
          roundMap.set(rs.roundNo, { roundNo: rs.roundNo, scores: {} });
        }
        roundMap.get(rs.roundNo)!.scores[rs.playerId] = rs.score;

        // Cek rekor skor round tertinggi
        if (
          !highestRoundScoreRecord ||
          rs.score > highestRoundScoreRecord.value
        ) {
          const info = playerMap[rs.playerId];
          if (info) {
            highestRoundScoreRecord = {
              value: rs.score,
              playerId: rs.playerId,
              playerName: info.name,
              playerColor: info.color,
              photoVersion: info.photoVersion,
              gameName: g.name,
              gameId: g.id,
              date: rs.createdAt,
            };
          }
        }
      }

      const calculated = calculateScores(
        pIds,
        pNames,
        g.initialScore,
        [...roundMap.values()],
        g.winCondition as 'highest' | 'lowest'
      );

      finishedGameDataList.push({
        gameId: g.id,
        gameName: g.name,
        finishedAt: g.finishedAt ?? g.createdAt,
        winCondition: g.winCondition as 'highest' | 'lowest',
        initialScore: g.initialScore,
        playerScores: calculated.map((c) => ({
          playerId: c.playerId,
          totalScore: c.totalScore,
        })),
      });

      // Cek rekor skor game tertinggi & selisih kemenangan
      if (calculated.length >= 2) {
        const first = calculated[0];
        const second = calculated[1];

        // Skor game tertinggi
        if (
          !highestGameScoreRecord ||
          first.totalScore > highestGameScoreRecord.value
        ) {
          const info = playerMap[first.playerId];
          if (info) {
            highestGameScoreRecord = {
              value: first.totalScore,
              playerId: first.playerId,
              playerName: info.name,
              playerColor: info.color,
              photoVersion: info.photoVersion,
              borderId: info.borderId ?? null,
              gameName: g.name,
              gameId: g.id,
              date: g.finishedAt ?? g.createdAt,
            };
          }
        }

        // Selisih kemenangan terbesar
        const margin = Math.abs(first.totalScore - second.totalScore);
        if (
          !biggestWinMarginRecord ||
          margin > biggestWinMarginRecord.value
        ) {
          const info = playerMap[first.playerId];
          if (info) {
            biggestWinMarginRecord = {
              value: margin,
              playerId: first.playerId,
              playerName: info.name,
              playerColor: info.color,
              photoVersion: info.photoVersion,
              borderId: info.borderId ?? null,
              gameName: g.name,
              gameId: g.id,
              date: g.finishedAt ?? g.createdAt,
            };
          }
        }
      }
    }

    // Hitung leaderboard agregat
    const leaderboard = calculateLeaderboard(finishedGameDataList, playerMap);

    // Cek rekor win streak terpanjang
    let longestStreakRecord: RecordEntry | null = null;
    let maxStreak = 0;
    for (const entry of leaderboard) {
      if (entry.longestWinStreak > maxStreak) {
        maxStreak = entry.longestWinStreak;
        longestStreakRecord = {
          value: entry.longestWinStreak,
          playerId: entry.playerId,
          playerName: entry.playerName,
          playerColor: entry.playerColor,
          photoVersion: entry.photoVersion,
          borderId: entry.borderId ?? null,
          gameName: null,
          gameId: 0,
          date: now,
        };
      }
    }

    // Pengurutan leaderboard berdasarkan pilihan
    leaderboard.sort((a, b) => {
      if (sort === 'points') {
        return b.totalPoints - a.totalPoints;
      }
      if (sort === 'winrate') {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.wins - a.wins;
      }
      // default: 'wins'
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    });

    const records: Records = {
      highestGameScore: highestGameScoreRecord,
      highestRoundScore: highestRoundScoreRecord,
      biggestWinMargin: biggestWinMarginRecord,
      longestWinStreak: longestStreakRecord,
    };

    return NextResponse.json({
      data: {
        period,
        sort,
        leaderboard,
        records,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat leaderboard', 500);
  }
}
