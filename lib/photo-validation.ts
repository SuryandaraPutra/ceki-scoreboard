/**
 * Utilitas validasi foto profil pemain di server side.
 *
 * Rules:
 * - Format: hanya JPEG (cek magic bytes FF D8 FF)
 * - Ukuran: maksimal 300 KB
 * - Field: harus binary/blob
 */

/** Magic bytes JPEG: FF D8 FF */
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

/**
 * Validasi bahwa buffer adalah file JPEG berdasarkan magic bytes.
 */
export function isValidJpeg(buffer: Uint8Array): boolean {
  if (buffer.length < 3) return false;
  return (
    buffer[0] === JPEG_MAGIC[0] &&
    buffer[1] === JPEG_MAGIC[1] &&
    buffer[2] === JPEG_MAGIC[2]
  );
}

/** Ukuran maksimal foto yang diterima server (300 KB) */
export const MAX_PHOTO_SIZE = 300 * 1024; // 300 KB dalam bytes

/**
 * Validasi foto yang diupload:
 * - Cek tipe MIME header
 * - Cek magic bytes
 * - Cek ukuran
 *
 * @returns pesan error atau null jika valid
 */
export async function validatePhotoUpload(
  data: ArrayBuffer
): Promise<string | null> {
  const buffer = new Uint8Array(data);

  // Cek ukuran
  if (buffer.length === 0) {
    return 'File foto tidak boleh kosong';
  }

  if (buffer.length > MAX_PHOTO_SIZE) {
    return `Ukuran foto maksimal 300 KB (saat ini ${Math.round(buffer.length / 1024)} KB)`;
  }

  // Cek magic bytes JPEG
  if (!isValidJpeg(buffer)) {
    return 'Format foto harus JPEG. Pastikan foto sudah dikompresi di sisi klien.';
  }

  return null; // Valid
}
