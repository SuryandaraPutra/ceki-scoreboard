/**
 * Zod validation schemas untuk semua API route.
 * Pesan error dalam Bahasa Indonesia.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────
// FORMAT ERROR STANDAR
// ─────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export function makeError(code: string, message: string, status = 400): Response {
  return Response.json(
    { error: { code, message } } satisfies ApiError,
    { status }
  );
}

// ─────────────────────────────────────────────
// PLAYERS
// ─────────────────────────────────────────────

export const CreatePlayerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama tidak boleh kosong')
    .max(20, 'Nama maksimal 20 karakter'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Format warna harus hex 6 digit, mis. #10b981')
    .default('#10b981'),
});

export const UpdatePlayerSchema = CreatePlayerSchema.partial();

// ─────────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────────

export const CreateGameSchema = z.object({
  name: z
    .string()
    .trim()
    .max(50, 'Nama game maksimal 50 karakter')
    .optional(),
  playerIds: z
    .array(z.number().int().positive())
    .length(4, 'Harus memilih tepat 4 pemain')
    .refine(
      (ids) => new Set(ids).size === 4,
      'Tidak boleh memilih pemain yang sama dua kali'
    ),
  initialScore: z
    .number()
    .int('Skor awal harus bilangan bulat')
    .default(0),
  winCondition: z
    .enum(['highest', 'lowest'], {
      errorMap: () => ({ message: 'Aturan menang harus "highest" atau "lowest"' }),
    })
    .default('highest'),
  scoreLimit: z
    .number()
    .int('Batas skor harus bilangan bulat')
    .min(1, 'Batas skor minimal 1')
    .max(99999, 'Batas skor maksimal 99999')
    .nullable()
    .default(250),
  scoreLimitAction: z
    .enum(['notify', 'ask', 'auto'], {
      errorMap: () => ({
        message: 'Aksi batas skor harus "notify", "ask", atau "auto"',
      }),
    })
    .default('ask'),
  zeroSum: z.boolean().default(false),
  quickValues: z
    .array(z.number().int().positive())
    .min(1, 'Minimal 1 nilai preset')
    .max(8, 'Maksimal 8 nilai preset')
    .default([5, 15, 25]),
  targetRounds: z
    .number()
    .int()
    .positive('Target round harus bilangan positif')
    .nullable()
    .optional(),
});

export const PatchGameSchema = z.object({
  name: z.string().trim().max(50).optional(),
  scoreLimit: z
    .number()
    .int()
    .min(1)
    .max(99999)
    .nullable()
    .optional(),
  scoreLimitAction: z.enum(['notify', 'ask', 'auto']).optional(),
  zeroSum: z.boolean().optional(),
});

// ─────────────────────────────────────────────
// ROUNDS
// ─────────────────────────────────────────────

export const CreateRoundSchema = z.object({
  scores: z
    .record(
      z.string().regex(/^\d+$/, 'Player ID harus angka'),
      z.number().int('Skor harus bilangan bulat')
    )
    .refine(
      (scores) => Object.keys(scores).length === 4,
      'Harus ada skor untuk tepat 4 pemain'
    ),
});

export const UpdateRoundSchema = z.object({
  scores: z
    .record(
      z.string().regex(/^\d+$/, 'Player ID harus angka'),
      z.number().int('Skor harus bilangan bulat')
    )
    .refine(
      (scores) => Object.keys(scores).length === 4,
      'Harus ada skor untuk tepat 4 pemain'
    ),
});

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

export const UpdateSettingsSchema = z.object({
  defaultScoreLimit: z
    .number()
    .int()
    .min(1)
    .max(99999)
    .nullable()
    .optional(),
  defaultScoreLimitAction: z.enum(['notify', 'ask', 'auto']).optional(),
  defaultWinCondition: z.enum(['highest', 'lowest']).optional(),
  defaultInitialScore: z.number().int().optional(),
  defaultQuickValues: z
    .array(z.number().int().positive())
    .min(1)
    .max(8)
    .optional(),
  roundScoreMin: z.number().int().optional(),
  roundScoreMax: z.number().int().optional(),
  defaultZeroSum: z.boolean().optional(),
  vibration: z.boolean().optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
});

// ─────────────────────────────────────────────
// IMPORT
// ─────────────────────────────────────────────

export const ImportDataSchema = z.object({
  mode: z.enum(['replace', 'merge'], {
    errorMap: () => ({
      message: 'Mode impor harus "replace" (ganti semua) atau "merge" (gabungkan)',
    }),
  }),
  data: z.object({
    players: z.array(z.any()),
    games: z.array(z.any()),
    gamePlayers: z.array(z.any()),
    rounds: z.array(z.any()),
    roundScores: z.array(z.any()),
    settings: z.any().optional(),
  }),
});

// ─────────────────────────────────────────────
// PIN
// ─────────────────────────────────────────────

export const PinSubmitSchema = z.object({
  pin: z
    .string()
    .min(1, 'PIN tidak boleh kosong')
    .max(20, 'PIN terlalu panjang'),
});
