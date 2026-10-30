/**
 * Skema database Ceki Scoreboard menggunakan Drizzle ORM.
 * Kompatibel dengan SQLite (lokal) dan Turso/libSQL (produksi).
 *
 * Tabel:
 *   players  — profil pemain permanen
 *   games    — sesi permainan
 *   game_players — 4 pemain per game dengan urutan tempat duduk
 *   rounds   — setiap round dalam game
 *   round_scores — skor tiap pemain per round
 *   settings — konfigurasi aplikasi (satu baris)
 */

import { sql } from 'drizzle-orm';
import {
  blob,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ─────────────────────────────────────────────
// PLAYERS
// ─────────────────────────────────────────────
export const players = sqliteTable(
  'players',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    /** Nama lower-case untuk pengecekan duplikat tanpa membedakan huruf */
    nameLower: text('name_lower').notNull(),
    /** Warna tema dalam format hex, mis. "#10b981" */
    color: text('color').notNull().default('#10b981'),
    /** Foto profil: JPEG blob, maks ~300 KB setelah validasi server */
    photo: blob('photo'),
    /** Versi foto: dinaikkan setiap kali foto diubah (untuk cache busting) */
    photoVersion: integer('photo_version').notNull().default(0),
    /** Border profil dekoratif mewah (nullable, default null) */
    borderId: text('border_id'),
    /** Soft delete: pemain diarsipkan jika punya riwayat game */
    archivedAt: integer('archived_at'), // unix timestamp atau null
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at')
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    nameLowerUniq: uniqueIndex('players_name_lower_uniq').on(t.nameLower),
  })
);

// ─────────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────────
export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'), // nama game opsional
  /** Status: 'active' | 'finished' */
  status: text('status').notNull().default('active'),
  /** Room / Meja: '1' | '2' (default '1') */
  room: text('room').notNull().default('1'),
  /** Aturan menang: 'highest' | 'lowest' */
  winCondition: text('win_condition').notNull().default('highest'),
  /** Skor awal tiap pemain */
  initialScore: integer('initial_score').notNull().default(0),
  /** Batas skor tertinggi opsional (default 250) */
  scoreLimit: integer('score_limit').default(250),
  /** Aksi saat batas tercapai: 'notify' | 'ask' | 'auto' */
  scoreLimitAction: text('score_limit_action').notNull().default('ask'),
  /** Mode zero-sum: total skor semua pemain dalam satu round harus = 0 */
  zeroSum: integer('zero_sum', { mode: 'boolean' }).notNull().default(false),
  /** Preset nilai cepat, disimpan sebagai JSON string, mis. "[5,15,25]" */
  quickValues: text('quick_values').notNull().default('[5,15,25]'),
  /** Target jumlah round (opsional) */
  targetRounds: integer('target_rounds'),
  startedAt: integer('started_at')
    .notNull()
    .default(sql`(unixepoch())`),
  finishedAt: integer('finished_at'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─────────────────────────────────────────────
// GAME_PLAYERS — 4 pemain per game
// ─────────────────────────────────────────────
export const gamePlayers = sqliteTable(
  'game_players',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id),
    /** Urutan tempat duduk: 0-3 */
    seatOrder: integer('seat_order').notNull(),
  },
  (t) => ({
    gamePlayerUniq: uniqueIndex('game_players_uniq').on(t.gameId, t.playerId),
    gameSeatUniq: uniqueIndex('game_players_seat_uniq').on(
      t.gameId,
      t.seatOrder
    ),
    gameIdIdx: index('game_players_game_id_idx').on(t.gameId),
  })
);

// ─────────────────────────────────────────────
// ROUNDS — satu baris per round
// ─────────────────────────────────────────────
export const rounds = sqliteTable(
  'rounds',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    /** Nomor round (1-based), unik dalam satu game */
    roundNo: integer('round_no').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at')
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    /** Unique index mencegah race condition dua perangkat simpan round bersamaan */
    gameRoundUniq: uniqueIndex('rounds_game_round_uniq').on(
      t.gameId,
      t.roundNo
    ),
    gameIdIdx: index('rounds_game_id_idx').on(t.gameId),
  })
);

// ─────────────────────────────────────────────
// ROUND_SCORES — skor tiap pemain per round
// ─────────────────────────────────────────────
export const roundScores = sqliteTable(
  'round_scores',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    roundId: integer('round_id')
      .notNull()
      .references(() => rounds.id, { onDelete: 'cascade' }),
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id),
    score: integer('score').notNull().default(0),
  },
  (t) => ({
    roundPlayerUniq: uniqueIndex('round_scores_round_player_uniq').on(
      t.roundId,
      t.playerId
    ),
    roundIdIdx: index('round_scores_round_id_idx').on(t.roundId),
  })
);

// ─────────────────────────────────────────────
// SETTINGS — satu baris konfigurasi global
// ─────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Batas skor default untuk game baru (default 250) */
  defaultScoreLimit: integer('default_score_limit').default(250),
  /** Aksi batas skor default */
  defaultScoreLimitAction: text('default_score_limit_action')
    .notNull()
    .default('ask'),
  /** Aturan menang default: 'highest' | 'lowest' */
  defaultWinCondition: text('default_win_condition')
    .notNull()
    .default('highest'),
  /** Skor awal default */
  defaultInitialScore: integer('default_initial_score').notNull().default(0),
  /** Preset nilai cepat default (JSON string) */
  defaultQuickValues: text('default_quick_values')
    .notNull()
    .default('[5,15,25]'),
  /** Batas nilai per round: min dan max (JSON string) */
  roundScoreMin: integer('round_score_min').notNull().default(-9999),
  roundScoreMax: integer('round_score_max').notNull().default(9999),
  /** Mode zero-sum default */
  defaultZeroSum: integer('default_zero_sum', { mode: 'boolean' })
    .notNull()
    .default(false),
  /** Getar di HP: aktif/tidak */
  vibration: integer('vibration', { mode: 'boolean' }).notNull().default(true),
  /** Tema: 'system' | 'light' | 'dark' */
  theme: text('theme').notNull().default('system'),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─────────────────────────────────────────────
// Type exports (inference dari schema)
// ─────────────────────────────────────────────
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type RoundScore = typeof roundScores.$inferSelect;
export type Settings = typeof settings.$inferSelect;
