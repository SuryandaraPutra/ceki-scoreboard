import type { Config } from 'drizzle-kit';

/**
 * Konfigurasi Drizzle Kit untuk migrasi/push skema.
 * Lokal: pakai SQLite file (tidak butuh variabel env).
 * Produksi: pakai Turso via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 */

const isProduction =
  process.env.TURSO_DATABASE_URL && process.env.TURSO_DATABASE_URL.length > 0;

const config: Config = isProduction
  ? {
      // --- Produksi: Turso (libSQL remote) ---
      dialect: 'turso',
      schema: './lib/schema.ts',
      out: './drizzle',
      dbCredentials: {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
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
