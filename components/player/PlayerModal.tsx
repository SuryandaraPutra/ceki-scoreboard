'use client';

/**
 * Modal untuk Tambah Pemain Baru atau Edit Profil Pemain yang sudah ada.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { PLAYER_COLOR_OPTIONS } from '@/lib/constants';
import { Camera, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: {
    id: number;
    name: string;
    color: string;
    photoVersion: number;
    borderId?: string | null;
  } | null;
  onSave: (data: { name: string; color: string }) => Promise<any>;
  onOpenPhotoCrop?: () => void;
  onOpenBorderModal?: () => void;
}

export function PlayerModal({
  isOpen,
  onClose,
  player,
  onSave,
  onOpenPhotoCrop,
  onOpenBorderModal,
}: PlayerModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(player);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setColor(player.color);
    } else {
      setName('');
      setColor('#10b981');
    }
  }, [player, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Nama pemain tidak boleh kosong');
      return;
    }
    if (trimmed.length > 20) {
      toast.error('Nama pemain maksimal 20 karakter');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({ name: trimmed, color });
      toast.success(isEdit ? 'Profil berhasil diperbarui' : 'Pemain berhasil ditambahkan');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Profil Pemain' : 'Tambah Pemain Baru'}
      description="Nama unik maks 20 karakter dan pilih warna tema"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
        {/* Avatar & Tombol Ubah Foto / Border */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <Avatar
              id={player?.id ?? 0}
              name={name || 'P'}
              color={color}
              photoVersion={player?.photoVersion ?? 0}
              borderId={player?.borderId}
              size="xl"
            />
            {isEdit && onOpenPhotoCrop && (
              <button
                type="button"
                onClick={onOpenPhotoCrop}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
                title="Ganti foto profil"
              >
                <Camera size={16} />
              </button>
            )}
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              {onOpenPhotoCrop && (
                <button
                  type="button"
                  onClick={onOpenPhotoCrop}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Ubah Foto Profil
                </button>
              )}
              {onOpenPhotoCrop && onOpenBorderModal && (
                <span className="text-slate-300 dark:text-slate-700">•</span>
              )}
              {onOpenBorderModal && (
                <button
                  type="button"
                  onClick={onOpenBorderModal}
                  className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  <Sparkles size={13} />
                  <span>Border Mewah</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Input Nama */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Nama Pemain
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Contoh: Budi, Agus..."
            className="input-field"
            autoFocus
          />
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
            <span>Maksimal 20 karakter</span>
            <span>{name.length}/20</span>
          </div>
        </div>

        {/* Pilihan Warna Tema Pemain */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Warna Tema Pemain
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {PLAYER_COLOR_OPTIONS.map((c) => {
              const isSelected = color === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="flex items-center gap-2 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left group"
                  style={{
                    backgroundColor: isSelected ? `${c.value}15` : undefined,
                    borderColor: isSelected ? c.value : undefined,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white"
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="btn-primary py-2.5 px-5 text-xs font-semibold"
          >
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pemain'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
