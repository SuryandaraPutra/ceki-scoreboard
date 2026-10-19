/**
 * API Route: /api/players/[id]
 * GET: Ambil detail pemain
 * PUT: Ubah nama atau warna pemain
 * DELETE: Hapus pemain (soft-delete jika sudah ada riwayat game, hard-delete jika belum)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gamePlayers, players } from '@/lib/schema';
import { UpdatePlayerSchema, makeError } from '@/lib/validations';
import { eq, and, not, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: { id: string };
}

/**
 * GET /api/players/[id]
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID pemain tidak valid', 400);
    }

    const [player] = await db
      .select({
        id: players.id,
        name: players.name,
        color: players.color,
        photoVersion: players.photoVersion,
        archivedAt: players.archivedAt,
        createdAt: players.createdAt,
        updatedAt: players.updatedAt,
      })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);

    if (!player) {
      return makeError('NOT_FOUND', 'Pemain tidak ditemukan', 404);
    }

    return NextResponse.json({ data: player });
  } catch (error) {
    console.error('Error in GET /api/players/[id]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat data pemain', 500);
  }
}

/**
 * PUT /api/players/[id]
 * Ubah nama atau warna pemain
 */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID pemain tidak valid', 400);
    }

    const body = await req.json();
    const parsed = UpdatePlayerSchema.safeParse(body);

    if (!parsed.success) {
      return makeError(
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message ?? 'Data yang dikirim tidak valid',
        400
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: sql`(unixepoch())`,
    };

    if (parsed.data.name !== undefined) {
      const name = parsed.data.name;
      const nameLower = name.toLowerCase();

      // Cek duplikasi nama dengan pemain lain
      const existing = await db
        .select({ id: players.id })
        .from(players)
        .where(and(eq(players.nameLower, nameLower), not(eq(players.id, id))))
        .limit(1);

      if (existing.length > 0) {
        return makeError(
          'DUPLICATE_NAME',
          `Pemain dengan nama "${name}" sudah terdaftar`,
          409
        );
      }

      updateData.name = name;
      updateData.nameLower = nameLower;
    }

    if (parsed.data.color !== undefined) {
      updateData.color = parsed.data.color;
    }

    const [updated] = await db
      .update(players)
      .set(updateData)
      .where(eq(players.id, id))
      .returning({
        id: players.id,
        name: players.name,
        color: players.color,
        photoVersion: players.photoVersion,
        archivedAt: players.archivedAt,
      });

    if (!updated) {
      return makeError('NOT_FOUND', 'Pemain tidak ditemukan', 404);
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error in PUT /api/players/[id]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memperbarui pemain', 500);
  }
}

/**
 * DELETE /api/players/[id]
 * Cek apakah pemain punya riwayat game:
 * - Jika punya: soft delete (archivedAt = timestamp)
 * - Jika tidak: hard delete (hapus permanen dari DB)
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID pemain tidak valid', 400);
    }

    // Cek apakah pemain ada
    const [existing] = await db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);

    if (!existing) {
      return makeError('NOT_FOUND', 'Pemain tidak ditemukan', 404);
    }

    // Cek apakah pemain pernah bermain dalam game apa pun
    const gameHistory = await db
      .select({ id: gamePlayers.id })
      .from(gamePlayers)
      .where(eq(gamePlayers.playerId, id))
      .limit(1);

    if (gameHistory.length > 0) {
      // Pemain sudah punya riwayat game → Soft Delete (Arsipkan)
      const [archived] = await db
        .update(players)
        .set({
          archivedAt: sql`(unixepoch())`,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(players.id, id))
        .returning({
          id: players.id,
          name: players.name,
          archivedAt: players.archivedAt,
        });

      return NextResponse.json({
        data: archived,
        action: 'archived',
        message: `Pemain "${existing.name}" memiliki riwayat game dan telah diarsipkan`,
      });
    }

    // Pemain belum punya riwayat game → Hapus permanen
    await db.delete(players).where(eq(players.id, id));

    return NextResponse.json({
      action: 'deleted',
      message: `Pemain "${existing.name}" berhasil dihapus permanen`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/players/[id]:', error);
    return makeError('INTERNAL_ERROR', 'Gagal menghapus pemain', 500);
  }
}
