import type { Config } from 'drizzle-kit';

/**
 * Konfigurasi Drizzle Kit untuk migrasi/push skema.
 * Lokal: pakai SQLite file (tidak butuh variabel env).
 * Produksi: pakai Turso via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 */

const tursoUrl =
  process.env.TURSO_DATABASE_URL ||
  process.env.TURSO_DB_URL ||
  process.env.DATABASE_URL;
const tursoToken =
  process.env.TURSO_AUTH_TOKEN || process.env.TURSO_DB_AUTH_TOKEN;

const isProduction = Boolean(tursoUrl && tursoUrl.length > 0);

const config: Config = isProduction
  ? {
      // --- Produksi: Turso (libSQL remote) ---
      dialect: 'turso',
      schema: './lib/schema.ts',
      out: './drizzle',
      dbCredentials: {
        url: tursoUrl!,
        authToken: tursoToken!,
      },
    }
  : {
      // --- Lokal: SQLite file ---
      dialect: 'sqlite',
      schema: './lib/schema.ts',
      out: './drizzle',
      dbCredentials: {
        url: './data/ceki.db',
      },
    };

export default config;
