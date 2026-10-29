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

import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Tipe global untuk menyimpan singleton saat development
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var __libsqlRawClient: Client | undefined;
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_lower TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#10b981',
  photo BLOB,
  photo_version INTEGER NOT NULL DEFAULT 0,
  archived_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS players_name_lower_uniq ON players (name_lower);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  room TEXT NOT NULL DEFAULT '1',
  win_condition TEXT NOT NULL DEFAULT 'highest',
  initial_score INTEGER NOT NULL DEFAULT 0,
  score_limit INTEGER DEFAULT 250,
  score_limit_action TEXT NOT NULL DEFAULT 'ask',
  zero_sum INTEGER NOT NULL DEFAULT 0,
  quick_values TEXT NOT NULL DEFAULT '[5,15,25]',
  target_rounds INTEGER,
  started_at INTEGER NOT NULL DEFAULT (unixepoch()),
  finished_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS game_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  seat_order INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS game_players_uniq ON game_players (game_id, player_id);
CREATE UNIQUE INDEX IF NOT EXISTS game_players_seat_uniq ON game_players (game_id, seat_order);
CREATE INDEX IF NOT EXISTS game_players_game_id_idx ON game_players (game_id);

CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_no INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS rounds_game_round_uniq ON rounds (game_id, round_no);
CREATE INDEX IF NOT EXISTS rounds_game_id_idx ON rounds (game_id);

CREATE TABLE IF NOT EXISTS round_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  score INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS round_scores_round_player_uniq ON round_scores (round_id, player_id);
CREATE INDEX IF NOT EXISTS round_scores_round_id_idx ON round_scores (round_id);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  default_score_limit INTEGER DEFAULT 250,
  default_score_limit_action TEXT NOT NULL DEFAULT 'ask',
  default_win_condition TEXT NOT NULL DEFAULT 'highest',
  default_initial_score INTEGER NOT NULL DEFAULT 0,
  default_quick_values TEXT NOT NULL DEFAULT '[5,15,25]',
  round_score_min INTEGER NOT NULL DEFAULT -9999,
  round_score_max INTEGER NOT NULL DEFAULT 9999,
  default_zero_sum INTEGER NOT NULL DEFAULT 0,
  vibration INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'system',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
`;

/**
 * Buat koneksi libSQL berdasarkan environment variable.
 */
function createRawClient(): Client {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.TURSO_DB_URL ||
    process.env.DATABASE_URL;
  const tursoToken =
    process.env.TURSO_AUTH_TOKEN || process.env.TURSO_DB_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.length > 0) {
    return createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.resolve(dataDir, 'ceki.db').replace(/\\/g, '/');
  return createClient({
    url: `file:${dbPath}`,
  });
}

export const rawClient =
  globalThis.__libsqlRawClient ?? (globalThis.__libsqlRawClient = createRawClient());

export const db =
  globalThis.__dbInstance ?? (globalThis.__dbInstance = drizzle(rawClient, { schema }));

if (process.env.NODE_ENV === 'production') {
  globalThis.__dbInstance = undefined;
  globalThis.__libsqlRawClient = undefined;
}

/**
 * Fungsi otomatis untuk membuat semua tabel jika belum ada di database (Turso / SQLite).
 */
export async function ensureDbSchema(): Promise<void> {
  const client = rawClient;
  await client.executeMultiple(SCHEMA_SQL);
  try {
    const tableInfo = await client.execute('PRAGMA table_info(games)');
    const hasRoom = tableInfo.rows.some((row: any) => row.name === 'room');
    if (!hasRoom) {
      await client.execute("ALTER TABLE games ADD COLUMN room TEXT NOT NULL DEFAULT '1'");
    }
  } catch (e) {
    // Abaikan jika database remote tidak support pragma atau sudah ada
  }
}

export { schema };
