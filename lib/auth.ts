/**
 * Helper autentikasi PIN untuk middleware dan API route.
 *
 * Mekanisme:
 * 1. Jika APP_PIN tidak diisi → semua permintaan diizinkan (mode terbuka)
 * 2. Jika APP_PIN diisi → cek cookie ceki_pin yang berisi nilai PIN ter-hash
 *    - Cookie menggunakan tanda tangan HMAC-SHA256 via jose
 *    - Berlaku 30 hari
 *    - httpOnly + SameSite=Strict untuk keamanan
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'ceki_pin';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari dalam detik

/**
 * Ambil secret key dari COOKIE_SECRET env var.
 * Minimal 32 karakter.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.COOKIE_SECRET ?? 'ceki-default-secret-change-me!!';
  return new TextEncoder().encode(secret.padEnd(32, '!').slice(0, 64));
}

/**
 * Cek apakah aplikasi memerlukan PIN.
 */
export function isPinRequired(): boolean {
  return Boolean(process.env.APP_PIN && process.env.APP_PIN.length > 0);
}

/**
 * Buat JWT untuk cookie PIN.
 */
export async function createPinToken(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey());
  return token;
}

/**
 * Verifikasi apakah request sudah memiliki cookie PIN yang valid.
 * Mengembalikan true jika:
 * - PIN tidak diperlukan (APP_PIN kosong), atau
 * - Cookie PIN ada dan valid
 */
export async function verifyPinCookie(req: NextRequest): Promise<boolean> {
  if (!isPinRequired()) return true;

  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  try {
    await jwtVerify(cookieValue, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifikasi PIN yang dimasukkan pengguna.
 */
export function verifyPin(inputPin: string): boolean {
  const correctPin = process.env.APP_PIN;
  if (!correctPin) return true; // Tidak ada PIN = selalu valid
  return inputPin === correctPin;
}

/**
 * Set cookie PIN pada response.
 */
export function setPinCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return response;
}

/**
 * Hapus cookie PIN (logout).
 */
export function clearPinCookie(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE_NAME);
  return response;
}

/**
 * Helper untuk mengambil status auth dari server component (cookies()).
 */
export async function getServerAuthStatus(): Promise<boolean> {
  if (!isPinRequired()) return true;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  try {
    await jwtVerify(cookieValue, getSecretKey());
    return true;
  } catch {
    return false;
  }
}
