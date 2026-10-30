/**
 * API Route: /api/players
 * GET: Ambil daftar semua pemain (aktif dan diarsipkan)
 * POST: Tambah pemain baru
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players } from '@/lib/schema';
import { CreatePlayerSchema, makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/players
 * Mengembalikan daftar pemain dengan informasi status arsip dan versi foto.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') !== 'false';

    // Ambil kolom publik (tanpa kolom blob foto agar hemat bandwidth)
    const query = db
      .select({
        id: players.id,
        name: players.name,
        color: players.color,
        photoVersion: players.photoVersion,
        borderId: players.borderId,
        archivedAt: players.archivedAt,
        createdAt: players.createdAt,
        updatedAt: players.updatedAt,
      })
      .from(players);

    const result = await query.orderBy(players.name);

    const filtered = includeArchived
      ? result
      : result.filter((p) => p.archivedAt === null);

    return NextResponse.json({ data: filtered });
  } catch (error: any) {
    if (
      error?.message?.includes('no such table') ||
      error?.code === 'SQLITE_ERROR' ||
      error?.message?.includes('does not exist')
    ) {
      try {
        const { ensureDbSchema } = await import('@/lib/db');
        await ensureDbSchema();
        return NextResponse.json({ data: [] });
      } catch (initErr) {
        console.error('Failed to auto-init schema in GET /api/players:', initErr);
      }
    }
    console.error('Error in GET /api/players:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat daftar pemain', 500);
  }
}

/**
 * POST /api/players
 * Tambah pemain baru. Nama unik tanpa membedakan huruf besar/kecil.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreatePlayerSchema.safeParse(body);

    if (!parsed.success) {
      return makeError(
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message ?? 'Data pemain tidak valid',
        400
      );
    }

    const { name, color } = parsed.data;
    const nameLower = name.toLowerCase();

    // Cek apakah pemain dengan nama ini sudah ada (termasuk yang diarsipkan)
    const existing = await db
      .select({ id: players.id, archivedAt: players.archivedAt })
      .from(players)
      .where(eq(players.nameLower, nameLower))
      .limit(1);

    if (existing.length > 0) {
      const p = existing[0];
      if (p.archivedAt !== null) {
        // Jika sebelumnya diarsipkan, aktifkan kembali
        const [restored] = await db
          .update(players)
          .set({
            name,
            color,
            archivedAt: null,
            updatedAt: sql`(unixepoch())`,
          })
          .where(eq(players.id, p.id))
          .returning({
            id: players.id,
            name: players.name,
            color: players.color,
            photoVersion: players.photoVersion,
            archivedAt: players.archivedAt,
          });

        return NextResponse.json(
          { data: restored, message: 'Pemain berhasil diaktifkan kembali dari arsip' },
          { status: 200 }
        );
      }

      return makeError('DUPLICATE_NAME', `Pemain dengan nama "${name}" sudah terdaftar`, 409);
    }

    // Insert pemain baru
    const [created] = await db
      .insert(players)
      .values({
        name,
        nameLower,
        color,
      })
      .returning({
        id: players.id,
        name: players.name,
        color: players.color,
        photoVersion: players.photoVersion,
        borderId: players.borderId,
        archivedAt: players.archivedAt,
      });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    if (
      error?.message?.includes('no such table') ||
      error?.code === 'SQLITE_ERROR' ||
      error?.message?.includes('does not exist')
    ) {
      try {
        const { ensureDbSchema } = await import('@/lib/db');
        await ensureDbSchema();
      } catch (initErr) {
        console.error('Failed to auto-init schema in POST /api/players:', initErr);
      }
    }
    console.error('Error in POST /api/players:', error);
    return makeError('INTERNAL_ERROR', 'Gagal menambahkan pemain', 500);
  }
}
