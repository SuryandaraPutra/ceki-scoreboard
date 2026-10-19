/**
 * Singleton koneksi database menggunakan @libsql/client + Drizzle ORM.
 *
 * Strategi koneksi:
 * - Lokal (tidak ada TURSO_DATABASE_URL): pakai SQLite file ./data/ceki.db
 * - Produksi (ada TURSO_DATABASE_URL): pakai Turso/libSQL remote
 *
 * Singleton aman untuk Next.js hot reload:
 * menyimpan instance di global (hanya di development)
 * agar tidak membuka koneksi baru setiap kali file di-reload.
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Tipe global untuk menyimpan singleton saat development
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

/**
 * Buat koneksi libSQL berdasarkan environment variable.
 * Di produksi (Vercel + Turso), gunakan URL remote.
 * Di lokal, buat file SQLite di ./data/ceki.db.
 */
function createDbConnection() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.length > 0) {
    // --- Mode Produksi: Turso ---
    const client = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return drizzle(client, { schema });
  }

  // --- Mode Lokal: SQLite file ---
  // Pastikan direktori ./data/ ada
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.resolve(dataDir, 'ceki.db').replace(/\\/g, '/');
  const client = createClient({
    url: `file:${dbPath}`,
  });
  return drizzle(client, { schema });
}

/**
 * Instance Drizzle ORM yang bisa langsung digunakan di Route Handlers.
 * Singleton untuk menghindari koneksi berulang saat hot reload di dev.
 */
export const db =
  globalThis.__dbInstance ?? (globalThis.__dbInstance = createDbConnection());

// Di produksi, jangan simpan ke global (tidak perlu, tidak ada hot reload)
if (process.env.NODE_ENV === 'production') {
  globalThis.__dbInstance = undefined;
}

export { schema };
