'use client';

/**
 * Komponen Avatar Pemain:
 * Menampilkan foto profil dari /api/players/[id]/photo?v=[version] jika ada.
 * Jika tidak ada foto atau gagal dimuat, menampilkan inisial nama
 * dengan latar gradasi dari warna tema pemain.
 */

import React, { useState } from 'react';
import { getInitials, getAvatarGradient } from '@/lib/calc';
import { AvatarWithBorder } from './AvatarWithBorder';
import { BorderId } from '@/lib/borders';

interface AvatarProps {
  id: number;
  name: string;
  color: string;
  photoVersion?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  borderId?: BorderId | string | null;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function Avatar({
  id,
  name,
  color,
  photoVersion = 0,
  size = 'md',
  className = '',
  borderId = null,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const photoUrl = `/api/players/${id}/photo?v=${photoVersion}`;
  const showPhoto = photoVersion > 0 && !hasError;
  const initials = getInitials(name);
  const gradient = getAvatarGradient(color);

  const avatarElement = (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden font-bold select-none shadow-sm ${sizeClasses[size]} ${className}`}
      style={{
        background: gradient,
        border: `2px solid ${color}`,
      }}
    >
      {showPhoto ? (
        // Menggunakan img standar agar kompatibel dengan binary streaming route handler
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span className="text-white drop-shadow-sm tracking-wider">
          {initials}
        </span>
      )}
    </div>
  );

  if (!borderId) {
    return avatarElement;
  }

  return (
    <AvatarWithBorder borderId={borderId} size={size}>
      {avatarElement}
    </AvatarWithBorder>
  );
}
