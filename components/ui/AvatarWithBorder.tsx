'use client';

/**
 * Komponen Reusable <AvatarWithBorder>
 * Membungkus elemen avatar yang sudah ada secara NON-DESTRUKTIF.
 * Menambahkan lapisan bingkai (border) dekoratif di luar avatar menggunakan
 * CSS + SVG murni tanpa mengubah struktur gambar asli.
 */

import React from 'react';
import { BorderId, isValidBorderId } from '@/lib/borders';

interface AvatarWithBorderProps {
  borderId?: BorderId | string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

const sizePixels: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

export function AvatarWithBorder({
  borderId,
  size = 'md',
  className = '',
  children,
}: AvatarWithBorderProps) {
  // Jika tidak ada border atau ID tidak valid, kembalikan avatar asli polos
  if (!borderId || !isValidBorderId(borderId)) {
    return <>{children}</>;
  }

  const px = sizePixels[size] ?? 44;
  const isCrown = borderId === 'emerald-crown';
  const isLaurel = borderId === 'celestial-laurel';

  return (
    <div
      className={`pfb-container ${className}`}
      style={{ '--pfb-size': `${px}px` } as React.CSSProperties}
    >
      {/* 1. Slot Avatar Asli (Z-index 2) */}
      <div className="pfb-avatar-slot">{children}</div>

      {/* 2. Lapisan Border Dekoratif di Luar Avatar (Z-index 3) */}
      {borderId === 'royal-gold' && (
        <div className="pfb-border-layer pfb-border-royal-gold" />
      )}

      {borderId === 'platinum-frost' && (
        <div className="pfb-border-layer pfb-border-platinum-frost">
          <span className="pfb-frost-sparkle pfb-frost-sparkle-1" />
          <span className="pfb-frost-sparkle pfb-frost-sparkle-2" />
          <span className="pfb-frost-sparkle pfb-frost-sparkle-3" />
          <span className="pfb-frost-sparkle pfb-frost-sparkle-4" />
        </div>
      )}

      {borderId === 'emerald-crown' && (
        <div className="pfb-border-layer pfb-border-emerald-crown pfb-has-crown">
          {/* Mahkota Emas Kerajaan (SVG) di Puncak Avatar */}
          <svg
            className="pfb-crown-ornament"
            viewBox="0 0 24 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2 13.5L4 4.5L8.5 8.5L12 1.5L15.5 8.5L20 4.5L22 13.5H2Z"
              fill="url(#goldCrownGrad)"
              stroke="#D4AF37"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="1.5" r="1.2" fill="#FFF1A8" stroke="#D4AF37" strokeWidth="0.5" />
            <circle cx="4" cy="4.5" r="1" fill="#FFF1A8" stroke="#D4AF37" strokeWidth="0.5" />
            <circle cx="20" cy="4.5" r="1" fill="#FFF1A8" stroke="#D4AF37" strokeWidth="0.5" />
            <rect x="2" y="13.5" width="20" height="2" rx="0.5" fill="#D4AF37" />
            <defs>
              <linearGradient id="goldCrownGrad" x1="2" y1="1.5" x2="22" y2="15.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF1A8" />
                <stop offset="0.5" stopColor="#D4AF37" />
                <stop offset="1" stopColor="#8A6A12" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {borderId === 'rose-gold-noir' && (
        <div className="pfb-border-layer pfb-border-rose-gold-noir" />
      )}

      {borderId === 'sapphire-aurora' && (
        <div className="pfb-border-layer pfb-border-sapphire-aurora" />
      )}

      {borderId === 'imperial-ruby' && (
        <div className="pfb-border-layer pfb-border-imperial-ruby">
          <span className="pfb-ruby-gem pfb-ruby-gem-top" />
          <span className="pfb-ruby-gem pfb-ruby-gem-right" />
          <span className="pfb-ruby-gem pfb-ruby-gem-bottom" />
          <span className="pfb-ruby-gem pfb-ruby-gem-left" />
        </div>
      )}

      {borderId === 'diamond-prism' && (
        <div className="pfb-border-layer pfb-border-diamond-prism">
          {/* Bintang Kristal 4 Sudut (SVG) */}
          <svg
            className="pfb-prism-sparkle pfb-prism-sparkle-1"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" />
          </svg>
          <svg
            className="pfb-prism-sparkle pfb-prism-sparkle-2"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" />
          </svg>
        </div>
      )}

      {borderId === 'celestial-laurel' && (
        <div className="pfb-border-layer pfb-border-celestial-laurel pfb-has-laurel">
          {/* Karangan Daun Laurel Emas & Pita Bawah (SVG) */}
          <svg
            className="pfb-laurel-svg"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Sayap Daun Kiri */}
            <path
              d="M12 40C8 32 10 20 18 12C17 16 17 21 20 25C15 26 13 32 12 40Z"
              fill="url(#laurelGold)"
              stroke="#B48A14"
              strokeWidth="0.6"
            />
            <path
              d="M7 47C5 41 7 35 12 29C13 34 14 38 18 41C13 43 10 45 7 47Z"
              fill="url(#laurelGold)"
              stroke="#B48A14"
              strokeWidth="0.6"
            />
            {/* Sayap Daun Kanan */}
            <path
              d="M52 40C56 32 54 20 46 12C47 16 47 21 44 25C49 26 51 32 52 40Z"
              fill="url(#laurelGold)"
              stroke="#B48A14"
              strokeWidth="0.6"
            />
            <path
              d="M57 47C59 41 57 35 52 29C51 34 50 38 46 41C51 43 54 45 57 47Z"
              fill="url(#laurelGold)"
              stroke="#B48A14"
              strokeWidth="0.6"
            />
            {/* Pita Ikatan Tengah Bawah */}
            <path
              d="M32 56L28 61H36L32 56Z"
              fill="#D4AF37"
              stroke="#8A6A12"
              strokeWidth="0.5"
            />
            <circle cx="32" cy="55.5" r="2.2" fill="#FFF1A8" stroke="#8A6A12" strokeWidth="0.5" />
            <defs>
              <linearGradient id="laurelGold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF1A8" />
                <stop offset="0.6" stopColor="#D4AF37" />
                <stop offset="1" stopColor="#8A6A12" />
              </linearGradient>
            </defs>
          </svg>
          {/* Partikel Debu Emas Melayang */}
          <span className="pfb-dust-particle pfb-dust-1" />
          <span className="pfb-dust-particle pfb-dust-2" />
          <span className="pfb-dust-particle pfb-dust-3" />
        </div>
      )}
    </div>
  );
}

