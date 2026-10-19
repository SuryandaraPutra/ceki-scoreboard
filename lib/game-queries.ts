/**
 * Helper untuk mengambil data skor game lengkap dari database.
 * Dipakai oleh beberapa API route agar tidak duplikasi query.
 */

import { db } from './db';
import { gamePlayers, players, rounds, roundScores } from './schema';
import { eq } from 'drizzle-orm';
import {
  calculateScores,
  RoundData,
  type PlayerScore,
} from './calc';

export interface GameFullData {
  playerIds: number[];
  playerNames: Record<number, string>;
  playerColors: Record<number, string>;
  playerPhotoVersions: Record<number, number>;
  rounds: RoundData[];
  scores: PlayerScore[];
}

/**
 * Ambil semua data yang dibutuhkan untuk menghitung skor game:
 * - Daftar pemain (seat order)
 * - Semua round dan skor per pemain
 *
 * Menggunakan 2 query (dalam batas 2-3 query per request).
 */
export async function getGameFullData(
  gameId: number,
  initialScore: number,
  winCondition: 'highest' | 'lowest'
): Promise<GameFullData> {
  // Query 1: ambil game_players + data pemain
  const gpRows = await db
    .select({
      playerId: gamePlayers.playerId,
      seatOrder: gamePlayers.seatOrder,
      playerName: players.name,
      playerColor: players.color,
      photoVersion: players.photoVersion,
    })
    .from(gamePlayers)
    .innerJoin(players, eq(players.id, gamePlayers.playerId))
    .where(eq(gamePlayers.gameId, gameId))
    .orderBy(gamePlayers.seatOrder);

  const playerIds = gpRows.map((r) => r.playerId);
  const playerNames: Record<number, string> = {};
  const playerColors: Record<number, string> = {};
  const playerPhotoVersions: Record<number, number> = {};

  for (const row of gpRows) {
    playerNames[row.playerId] = row.playerName;
    playerColors[row.playerId] = row.playerColor;
    playerPhotoVersions[row.playerId] = row.photoVersion;
  }

  // Query 2: ambil semua round + skor (JOIN rounds ↔ round_scores)
  const roundRows = await db
    .select({
      roundId: rounds.id,
      roundNo: rounds.roundNo,
      playerId: roundScores.playerId,
      score: roundScores.score,
    })
    .from(rounds)
    .innerJoin(roundScores, eq(roundScores.roundId, rounds.id))
    .where(eq(rounds.gameId, gameId))
    .orderBy(rounds.roundNo);

  // Susun menjadi RoundData[]
  const roundMap = new Map<number, RoundData>();
  for (const row of roundRows) {
    if (!roundMap.has(row.roundNo)) {
      roundMap.set(row.roundNo, { roundNo: row.roundNo, scores: {} });
    }
    roundMap.get(row.roundNo)!.scores[row.playerId] = row.score;
  }
  const roundDataList = [...roundMap.values()].sort(
    (a, b) => a.roundNo - b.roundNo
  );

  // Hitung skor
  const scores = calculateScores(
    playerIds,
    playerNames,
    initialScore,
    roundDataList,
    winCondition
  );

  return {
    playerIds,
    playerNames,
    playerColors,
    playerPhotoVersions,
    rounds: roundDataList,
    scores,
  };
}
