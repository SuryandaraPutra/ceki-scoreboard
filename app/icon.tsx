import { ImageResponse } from 'next/og';

/**
 * Otomatis menghasilkan favicon dan icon PWA menggunakan ImageResponse
 */

export const runtime = 'edge';
export const size = {
  width: 192,
  height: 192,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 44,
          color: 'white',
          fontWeight: 900,
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
        }}
      >
        🎴
      </div>
    ),
    {
      ...size,
    }
  );
}
