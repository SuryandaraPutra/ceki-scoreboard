/**
 * API Route: /api/export
 * GET: Mengekspor seluruh data database (pemain, foto sebagai base64, game, round, skor, settings)
 *      dalam format JSON untuk backup atau migrasi dari lokal ke Vercel/Turso.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, gamePlayers, players, rounds, roundScores, settings } from '@/lib/schema';
import { makeError } from '@/lib/validations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // 1. Ambil semua pemain beserta foto profil
    const playerRows = await db.select().from(players);

    // Konversi foto blob menjadi string Base64
    const playersExport = playerRows.map((p) => {
      let photoBase64: string | null = null;
      if (p.photo) {
        const buffer = p.photo as Uint8Array | Buffer;
        const b64 = Buffer.from(buffer).toString('base64');
        photoBase64 = `data:image/jpeg;base64,${b64}`;
      }

      return {
        id: p.id,
        name: p.name,
        nameLower: p.nameLower,
        color: p.color,
        photoBase64,
        photoVersion: p.photoVersion,
        archivedAt: p.archivedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    // 2. Ambil semua game
    const gameRows = await db.select().from(games);

    // 3. Ambil semua game_players
    const gpRows = await db.select().from(gamePlayers);

    // 4. Ambil semua rounds
    const roundRows = await db.select().from(rounds);

    // 5. Ambil semua round_scores
    const rsRows = await db.select().from(roundScores);

    // 6. Ambil settings
    const settingRows = await db.select().from(settings).limit(1);

    const exportPayload = {
      version: 1,
      appName: 'Ceki Scoreboard',
      exportedAt: Math.floor(Date.now() / 1000),
      data: {
        players: playersExport,
        games: gameRows,
        gamePlayers: gpRows,
        rounds: roundRows,
        roundScores: rsRows,
        settings: settingRows[0] ?? null,
      },
    };

    const filename = `ceki-scoreboard-backup-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/export:', error);
    return makeError('INTERNAL_ERROR', 'Gagal mengekspor data', 500);
  }
}
