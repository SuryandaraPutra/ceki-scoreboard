/**
 * API Auth PIN:
 * POST /api/auth/pin - Verifikasi PIN dan set cookie jika benar
 * DELETE /api/auth/pin - Logout (hapus cookie)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPin,
  createPinToken,
  setPinCookie,
  clearPinCookie,
  isPinRequired,
  verifyPinCookie,
} from '@/lib/auth';
import { PinSubmitSchema, makeError } from '@/lib/validations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cek status autentikasi saat ini
 */
export async function GET(req: NextRequest) {
  const pinRequired = isPinRequired();
  if (!pinRequired) {
    return NextResponse.json({ pinRequired: false, authenticated: true });
  }

  const authenticated = await verifyPinCookie(req);
  return NextResponse.json({ pinRequired: true, authenticated });
}

/**
 * Submit PIN untuk verifikasi
 */
export async function POST(req: NextRequest) {
  try {
    if (!isPinRequired()) {
      return NextResponse.json({ success: true, message: 'PIN tidak diaktifkan' });
    }

    const body = await req.json();
    const parsed = PinSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return makeError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Input tidak valid', 400);
    }

    const { pin } = parsed.data;
    const isValid = verifyPin(pin);

    if (!isValid) {
      return makeError('INVALID_PIN', 'PIN yang Anda masukkan salah', 401);
    }

    // Buat JWT token dan set cookie
    const token = await createPinToken();
    const res = NextResponse.json({ success: true, message: 'Autentikasi berhasil' });
    return setPinCookie(res, token);
  } catch (error) {
    console.error('Error in POST /api/auth/pin:', error);
    return makeError('INTERNAL_ERROR', 'Terjadi kesalahan pada server', 500);
  }
}

/**
 * Logout: hapus cookie PIN
 */
export async function DELETE() {
  const res = NextResponse.json({ success: true, message: 'Berhasil keluar' });
  return clearPinCookie(res);
}
