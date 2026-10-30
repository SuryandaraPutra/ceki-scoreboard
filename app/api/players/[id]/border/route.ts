/**
 * API Route: /api/players/[id]/border
 * PATCH / POST: Memperbarui atau mereset border profil dekoratif pemain.
 * Menggunakan validasi server-side berbasis whitelist di lib/borders.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players } from '@/lib/schema';
import { isValidBorderId } from '@/lib/borders';
import { makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return handleUpdateBorder(req, params.id);
}

export async function POST(req: NextRequest, { params }: Params) {
  return handleUpdateBorder(req, params.id);
}

async function handleUpdateBorder(req: NextRequest, idParam: string) {
  try {
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID pemain tidak valid', 400);
    }

    // 1. Cek keberadaan pemain
    const [existing] = await db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);

    if (!existing) {
      return makeError('NOT_FOUND', 'Pemain tidak ditemukan', 404);
    }

    // 2. Baca body & sanitasi
    const body = await req.json().catch(() => ({}));
    let requestedBorderId = body.borderId;

    // Normalisasi: string kosong atau string 'none' dianggap null (Tanpa Border)
    if (requestedBorderId === '' || requestedBorderId === 'none') {
      requestedBorderId = null;
    }

    // 3. Validasi ketat terhadap whitelist border resmi
    if (!isValidBorderId(requestedBorderId)) {
      return makeError(
        'INVALID_BORDER',
        'Pilihan border tidak dikenali atau tidak valid dalam sistem',
        400
      );
    }

    // 4. Update border_id di database
    const [updated] = await db
      .update(players)
      .set({
        borderId: requestedBorderId,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(players.id, id))
      .returning({
        id: players.id,
        name: players.name,
        color: players.color,
        photoVersion: players.photoVersion,
        borderId: players.borderId,
        archivedAt: players.archivedAt,
      });

    return NextResponse.json({
      data: updated,
      message: requestedBorderId
        ? `Border profil untuk ${existing.name} berhasil diperbarui`
        : `Border profil untuk ${existing.name} berhasil direset ke standar`,
    });
  } catch (error) {
    console.error('Error in /api/players/[id]/border:', error);
    return makeError('INTERNAL_ERROR', 'Gagal menyimpan pilihan border', 500);
  }
}

