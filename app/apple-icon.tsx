import { ImageResponse } from 'next/og';

/**
 * Otomatis menghasilkan apple-touch-icon untuk perangkat iOS
 */

export const runtime = 'edge';
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 90,
          background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
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
