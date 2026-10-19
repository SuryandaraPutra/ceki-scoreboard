/**
 * API Route: /api/settings
 * GET: Mengambil konfigurasi global aplikasi
 * PUT: Memperbarui konfigurasi global aplikasi
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { getOrCreateSettings } from '@/lib/settings';
import { UpdateSettingsSchema, makeError } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const currentSettings = await getOrCreateSettings();

    // Parse JSON string field quickValues
    let quickValues = [5, 15, 25];
    try {
      quickValues = JSON.parse(currentSettings.defaultQuickValues);
    } catch {
      // Abaikan jika gagal
    }

    return NextResponse.json({
      data: {
        ...currentSettings,
        defaultQuickValues: quickValues,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memuat pengaturan', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return makeError(
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message ?? 'Data pengaturan tidak valid',
        400
      );
    }

    const current = await getOrCreateSettings();

    const updateData: Record<string, any> = {
      updatedAt: sql`(unixepoch())`,
    };

    if (parsed.data.defaultScoreLimit !== undefined) {
      updateData.defaultScoreLimit = parsed.data.defaultScoreLimit;
    }
    if (parsed.data.defaultScoreLimitAction !== undefined) {
      updateData.defaultScoreLimitAction = parsed.data.defaultScoreLimitAction;
    }
    if (parsed.data.defaultWinCondition !== undefined) {
      updateData.defaultWinCondition = parsed.data.defaultWinCondition;
    }
    if (parsed.data.defaultInitialScore !== undefined) {
      updateData.defaultInitialScore = parsed.data.defaultInitialScore;
    }
    if (parsed.data.defaultQuickValues !== undefined) {
      updateData.defaultQuickValues = JSON.stringify(parsed.data.defaultQuickValues);
    }
    if (parsed.data.roundScoreMin !== undefined) {
      updateData.roundScoreMin = parsed.data.roundScoreMin;
    }
    if (parsed.data.roundScoreMax !== undefined) {
      updateData.roundScoreMax = parsed.data.roundScoreMax;
    }
    if (parsed.data.defaultZeroSum !== undefined) {
      updateData.defaultZeroSum = parsed.data.defaultZeroSum;
    }
    if (parsed.data.vibration !== undefined) {
      updateData.vibration = parsed.data.vibration;
    }
    if (parsed.data.theme !== undefined) {
      updateData.theme = parsed.data.theme;
    }

    const [updated] = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.id, current.id))
      .returning();

    let quickValues = [5, 15, 25];
    try {
      quickValues = JSON.parse(updated.defaultQuickValues);
    } catch {
      // Abaikan jika gagal
    }

    return NextResponse.json({
      data: {
        ...updated,
        defaultQuickValues: quickValues,
      },
      message: 'Pengaturan berhasil disimpan',
    });
  } catch (error) {
    console.error('Error in PUT /api/settings:', error);
    return makeError('INTERNAL_ERROR', 'Gagal memperbarui pengaturan', 500);
  }
}
