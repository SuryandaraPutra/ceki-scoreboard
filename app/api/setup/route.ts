/**
 * API Route: /api/setup
 * GET: Inisialisasi otomatis semua tabel database di Turso/SQLite
 *      Menjalankan CREATE TABLE IF NOT EXISTS untuk seluruh skema
 */

import { NextResponse } from 'next/server';
import { ensureDbSchema } from '@/lib/db';
import { getOrCreateSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // 1. Eksekusi pembuatan seluruh tabel jika belum ada
    await ensureDbSchema();

    // 2. Pastikan kolom room ada di tabel games (coba ALTER TABLE secara eksplisit)
    let alterResult = 'already exists or altered';
    try {
      const { rawClient } = await import('@/lib/db');
      await rawClient.execute("ALTER TABLE games ADD COLUMN room TEXT NOT NULL DEFAULT '1'");
      alterResult = 'added column room successfully';
    } catch (err: any) {
      alterResult = `alter error/ignored: ${err?.message}`;
    }

    // 3. Cek struktur kolom games saat ini
    const { rawClient } = await import('@/lib/db');
    const tableInfo = await rawClient.execute('PRAGMA table_info(games)');
    const columns = tableInfo.rows.map((r: any) => r.name || r[1]);

    // 4. Buat baris settings default jika belum ada
    const defaultSettings = await getOrCreateSettings();

    return NextResponse.json({
      success: true,
      message: '✅ Semua tabel database Ceki Scoreboard berhasil diinisialisasi di Turso!',
      alterResult,
      gamesColumns: columns,
      settings: defaultSettings,
    });
  } catch (error: any) {
    console.error('Error in /api/setup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal menginisialisasi database',
      },
      { status: 500 }
    );
  }
}
