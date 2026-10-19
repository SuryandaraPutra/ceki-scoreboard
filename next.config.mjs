/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Daftarkan modul native libSQL agar tidak di-bundle oleh webpack.
   * Ini penting agar @libsql/client bekerja di Next.js App Router
   * baik di lokal maupun di Vercel (Node.js runtime).
   */
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },

  /**
   * Izinkan akses dari perangkat lain di jaringan lokal (WiFi).
   * Tambahkan IP laptop Anda saat menjalankan `npm run dev:lan`.
   * Contoh: allowedDevOrigins: ['192.168.1.100']
   */
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS
    ? process.env.DEV_ALLOWED_ORIGINS.split(',')
    : [],

  /**
   * Konfigurasi header untuk endpoint foto pemain:
   * Cache panjang (1 tahun) + parameter versi (?v=) untuk bust cache.
   */
  async headers() {
    return [
      {
        source: '/api/players/:id/photo',
        headers: [
          {
            key: 'Cache-Control',
            // Foto di-cache browser 1 tahun, tapi revalidasi saat ada ?v= baru
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  /**
   * Konfigurasi webpack untuk menangani modul binary libSQL.
   * Modul `.node` (native addon) di-eksklusi dari bundling.
   */
  webpack(config, { isServer }) {
    if (isServer) {
      // Abaikan modul native yang tidak bisa di-bundle
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@libsql/client');
      }
    }
    return config;
  },
};

export default nextConfig;
