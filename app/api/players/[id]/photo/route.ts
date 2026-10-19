/**
 * API Route: /api/players/[id]/photo
 * GET: Mengambil foto JPEG pemain dari BLOB database
 * PUT: Mengunggah/mengganti foto pemain (validasi JPEG magic bytes & maks 300 KB)
 * DELETE: Menghapus foto profil pemain
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players } from '@/lib/schema';
import { validatePhotoUpload } from '@/lib/photo-validation';
import { makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: { id: string };
}

/**
 * GET /api/players/[id]/photo
 * Mengembalikan file gambar JPEG langsung dari BLOB database.
 * Di-cache browser 1 tahun karena ada parameter versi ?v= untuk cache busting.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID pemain tidak valid', 400);
    }

    const [row] = await db
      .select({ photo: players.photo })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);

    if (!row || !row.photo) {
      return makeError('NOT_FOUND', 'Foto tidak ditemukan', 404);
    }

    // Convert ke Buffer untuk Response binary
    const buffer = Buffer.from(row.photo as any);

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/players/[id]/photo:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat foto', 500);
  }
}

/**
 * PUT /api/players/[id]/photo
 * Upload foto profil pemain.
 * Menerima FormData dengan field 'photo' atau raw binary body.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID pemain tidak valid', 400);
    }

    // Cek apakah pemain ada
    const [existing] = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);

    if (!existing) {
      return makeError('NOT_FOUND', 'Pemain tidak ditemukan', 404);
    }

    let buffer: ArrayBuffer;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('photo') as File | null;
      if (!file) {
        return makeError('VALIDATION_ERROR', 'File foto tidak ditemukan dalam permintaan', 400);
      }
      buffer = await file.arrayBuffer();
    } else {
      buffer = await req.arrayBuffer();
    }

    // Validasi di server side: ukuran <= 300KB dan magic bytes JPEG
    const validationError = await validatePhotoUpload(buffer);
    if (validationError) {
      return makeError('INVALID_PHOTO', validationError, 400);
    }

    // Simpan ke kolom BLOB dan naikkan photoVersion
    const [updated] = await db
      .update(players)
      .set({
        photo: Buffer.from(buffer),
        photoVersion: sql`${players.photoVersion} + 1`,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(players.id, id))
      .returning({
        id: players.id,
        photoVersion: players.photoVersion,
      });

    return NextResponse.json({
      data: updated,
      message: 'Foto profil berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error in PUT /api/players/[id]/photo:', error);
    return makeError('INTERNAL_ERROR', 'Gagal mengunggah foto', 500);
  }
}

/**
 * DELETE /api/players/[id]/photo
 * Hapus foto profil pemain (kembali ke avatar inisial)
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return makeError('INVALID_ID', 'ID pemain tidak valid', 400);
    }

    const [updated] = await db
      .update(players)
      .set({
        photo: null,
        photoVersion: sql`${players.photoVersion} + 1`,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(players.id, id))
      .returning({
        id: players.id,
        photoVersion: players.photoVersion,
      });

    if (!updated) {
      return makeError('NOT_FOUND', 'Pemain tidak ditemukan', 404);
    }

    return NextResponse.json({
      data: updated,
      message: 'Foto profil berhasil dihapus',
    });
  } catch (error) {
    console.error('Error in DELETE /api/players/[id]/photo:', error);
    return makeError('INTERNAL_ERROR', 'Gagal menghapus foto', 500);
  }
}
