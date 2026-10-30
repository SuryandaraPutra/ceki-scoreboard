'use client';

/**
 * Modal Pemilihan Border Profil Mewah.
 * Membuka menu BorderPickerSection di dalam modal responsive.
 */

import React from 'react';
import { Modal } from '../ui/Modal';
import { BorderPickerSection } from './BorderPickerSection';
import { BorderId } from '@/lib/borders';

interface ProfileBorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: number;
    name: string;
    color: string;
    photoVersion: number;
    borderId?: BorderId | string | null;
  } | null;
  onSaveBorder: (borderId: BorderId) => Promise<any>;
}

export function ProfileBorderModal({
  isOpen,
  onClose,
  player,
  onSaveBorder,
}: ProfileBorderModalProps) {
  if (!player) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bingkai Profil: ${player.name}`}
      description="Pilih salah satu dari 8 bingkai mewah untuk disematkan pada foto profil"
      maxWidth="lg"
    >
      <div className="mt-2">
        <BorderPickerSection
          player={player}
          onSaveBorder={onSaveBorder}
          onSuccess={onClose}
        />
      </div>
    </Modal>
  );
}

