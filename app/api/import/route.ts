/**
 * API Route: /api/import
 * POST: Mengimpor data JSON (hasil ekspor).
 *       Mode:
 *       - 'replace': Menghapus semua data yang ada dan mengganti seluruhnya.
 *       - 'merge': Menambahkan data baru tanpa menghapus data lama.
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
import { ImportDataSchema, makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Konversi string base64 kembali menjadi Buffer binary
 */
function base64ToBuffer(dataUrl: string | null): Buffer | null {
  if (!dataUrl) return null;
  const base64Index = dataUrl.indexOf(';base64,');
  const base64 = base64Index !== -1 ? dataUrl.slice(base64Index + 8) : dataUrl;
  return Buffer.from(base64, 'base64');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ImportDataSchema.safeParse(body);

    if (!parsed.success) {
      return makeError(
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message ?? 'Format data impor tidak valid',
        400
      );
    }

    const { mode, data } = parsed.data;

    if (mode === 'replace') {
      // 1. Hapus semua data (urutan cascade: round_scores, rounds, game_players, games, players)
      await db.delete(roundScores);
      await db.delete(rounds);
      await db.delete(gamePlayers);
      await db.delete(games);
      await db.delete(players);

      // 2. Masukkan players
      const playerOldToNewId = new Map<number, number>();
      if (Array.isArray(data.players)) {
        for (const p of data.players) {
          const photoBuffer = base64ToBuffer(p.photoBase64 || null);
          const [inserted] = await db
            .insert(players)
            .values({
              name: p.name,
              nameLower: p.nameLower || p.name.toLowerCase(),
              color: p.color || '#10b981',
              photo: photoBuffer,
              photoVersion: p.photoVersion ?? 0,
              archivedAt: p.archivedAt ?? null,
              createdAt: p.createdAt ?? sql`(unixepoch())`,
              updatedAt: p.updatedAt ?? sql`(unixepoch())`,
            })
            .returning({ id: players.id });

          if (p.id) {
            playerOldToNewId.set(p.id, inserted.id);
          }
        }
      }

      // 3. Masukkan games
      const gameOldToNewId = new Map<number, number>();
      if (Array.isArray(data.games)) {
        for (const g of data.games) {
          const [inserted] = await db
            .insert(games)
            .values({
              name: g.name ?? null,
              status: g.status ?? 'finished',
              winCondition: g.winCondition ?? 'highest',
              initialScore: g.initialScore ?? 0,
              scoreLimit: g.scoreLimit ?? null,
              scoreLimitAction: g.scoreLimitAction ?? 'ask',
              zeroSum: Boolean(g.zeroSum),
              quickValues:
                typeof g.quickValues === 'string'
                  ? g.quickValues
                  : JSON.stringify(g.quickValues ?? [5, 15, 25]),
              targetRounds: g.targetRounds ?? null,
              startedAt: g.startedAt ?? sql`(unixepoch())`,
              finishedAt: g.finishedAt ?? null,
              createdAt: g.createdAt ?? sql`(unixepoch())`,
              updatedAt: g.updatedAt ?? sql`(unixepoch())`,
            })
            .returning({ id: games.id });

          if (g.id) {
            gameOldToNewId.set(g.id, inserted.id);
          }
        }
      }

      // 4. Masukkan game_players
      if (Array.isArray(data.gamePlayers)) {
        for (const gp of data.gamePlayers) {
          const newGameId = gameOldToNewId.get(gp.gameId) ?? gp.gameId;
          const newPlayerId = playerOldToNewId.get(gp.playerId) ?? gp.playerId;

          await db.insert(gamePlayers).values({
            gameId: newGameId,
            playerId: newPlayerId,
            seatOrder: gp.seatOrder ?? 0,
          });
        }
      }

      // 5. Masukkan rounds
      const roundOldToNewId = new Map<number, number>();
      if (Array.isArray(data.rounds)) {
        for (const r of data.rounds) {
          const newGameId = gameOldToNewId.get(r.gameId) ?? r.gameId;
          const [inserted] = await db
            .insert(rounds)
            .values({
              gameId: newGameId,
              roundNo: r.roundNo,
              createdAt: r.createdAt ?? sql`(unixepoch())`,
              updatedAt: r.updatedAt ?? sql`(unixepoch())`,
            })
            .returning({ id: rounds.id });

          if (r.id) {
            roundOldToNewId.set(r.id, inserted.id);
          }
        }
      }

      // 6. Masukkan round_scores
      if (Array.isArray(data.roundScores)) {
        for (const rs of data.roundScores) {
          const newRoundId = roundOldToNewId.get(rs.roundId) ?? rs.roundId;
          const newPlayerId = playerOldToNewId.get(rs.playerId) ?? rs.playerId;

          await db.insert(roundScores).values({
            roundId: newRoundId,
            playerId: newPlayerId,
            score: rs.score ?? 0,
          });
        }
      }

      // 7. Update settings jika ada
      if (data.settings) {
        const s = data.settings;
        const [existing] = await db.select({ id: settings.id }).from(settings).limit(1);
        if (existing) {
          await db
            .update(settings)
            .set({
              defaultScoreLimit: s.defaultScoreLimit ?? null,
              defaultScoreLimitAction: s.defaultScoreLimitAction ?? 'ask',
              defaultWinCondition: s.defaultWinCondition ?? 'highest',
              defaultInitialScore: s.defaultInitialScore ?? 0,
              defaultQuickValues:
                typeof s.defaultQuickValues === 'string'
                  ? s.defaultQuickValues
                  : JSON.stringify(s.defaultQuickValues ?? [5, 15, 25]),
              roundScoreMin: s.roundScoreMin ?? -9999,
              roundScoreMax: s.roundScoreMax ?? 9999,
              defaultZeroSum: Boolean(s.defaultZeroSum),
              vibration: Boolean(s.vibration ?? true),
              theme: s.theme ?? 'system',
              updatedAt: sql`(unixepoch())`,
            })
            .where(eq(settings.id, existing.id));
        }
      }

      return NextResponse.json({
        message: 'Data berhasil diimpor sepenuhnya (mode: ganti semua)',
        imported: {
          players: data.players?.length ?? 0,
          games: data.games?.length ?? 0,
          rounds: data.rounds?.length ?? 0,
        },
      });
    }

    // Mode 'merge' (gabungkan pemain baru)
    let addedPlayers = 0;
    if (Array.isArray(data.players)) {
      for (const p of data.players) {
        const nameLower = (p.nameLower || p.name).toLowerCase();
        const existing = await db
          .select({ id: players.id })
          .from(players)
          .where(eq(players.nameLower, nameLower))
          .limit(1);

        if (existing.length === 0) {
          const photoBuffer = base64ToBuffer(p.photoBase64 || null);
          await db.insert(players).values({
            name: p.name,
            nameLower,
            color: p.color || '#10b981',
            photo: photoBuffer,
            photoVersion: p.photoVersion ?? 0,
          });
          addedPlayers++;
        }
      }
    }

    return NextResponse.json({
      message: `Data berhasil digabungkan. Ditambahkan ${addedPlayers} pemain baru.`,
      addedPlayers,
    });
  } catch (error) {
    console.error('Error in POST /api/import:', error);
    return makeError('INTERNAL_ERROR', 'Gagal mengimpor data', 500);
  }
}
