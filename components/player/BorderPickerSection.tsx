'use client';

/**
 * Komponen Pemilihan Border Profil Mewah:
 * - Preview live besar di atas grid kartu
 * - Grid kartu pilihan: 2 kolom di mobile, 4 kolom di desktop
 * - Aksesibilitas: role="radiogroup", kartu role="radio", aria-checked, navigasi keyboard (Arrow, Enter, Space)
 * - State: normal, hover (lift + glow halus), selected (outline emas + centang), focus-visible
 * - Tombol aksi mandiri: "Simpan Border" & "Reset" dengan notifikasi sukses Sonner
 */

import React, { useState, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import { BORDER_LIST, BorderId, getBorderById } from '@/lib/borders';
import { Check, Sparkles, RotateCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface BorderPickerSectionProps {
  player: {
    id: number;
    name: string;
    color: string;
    photoVersion: number;
    borderId?: BorderId | string | null;
  };
  onSaveBorder: (borderId: BorderId) => Promise<any>;
  onSuccess?: () => void;
  className?: string;
}

export function BorderPickerSection({
  player,
  onSaveBorder,
  onSuccess,
  className = '',
}: BorderPickerSectionProps) {
  // Border awal pemain
  const initialBorder = (player.borderId as BorderId) ?? null;
  // Border yang sedang dipilih di preview (sebelum disimpan)
  const [selectedBorder, setSelectedBorder] = useState<BorderId>(initialBorder);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedBorder((player.borderId as BorderId) ?? null);
  }, [player.borderId, player.id]);

  const hasChanged = selectedBorder !== initialBorder;
  const currentBorderInfo = getBorderById(selectedBorder);

  // Simpan pilihan border ke server
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveBorder(selectedBorder);
      toast.success(
        selectedBorder
          ? `✨ Border "${currentBorderInfo.name}" berhasil dipasang!`
          : 'Border berhasil direset ke tampilan standar.'
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan border profil');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset pilihan kembali ke border yang tersimpan saat ini
  const handleReset = () => {
    setSelectedBorder(initialBorder);
    toast.info('Pilihan border dikembalikan ke pengaturan awal');
  };

  // Navigasi keyboard pada radiogroup
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % BORDER_LIST.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + BORDER_LIST.length) % BORDER_LIST.length;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setSelectedBorder(BORDER_LIST[index].id);
      return;
    }

    if (nextIndex !== index) {
      const nextCard = BORDER_LIST[nextIndex];
      setSelectedBorder(nextCard.id);
      const el = document.getElementById(`pfb-option-${nextIndex}`);
      el?.focus();
    }
  };

  return (
    <section
      aria-label="Pemilihan Border Profil"
      className={`flex flex-col gap-5 p-4 sm:p-6 rounded-3xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 transition-all ${className}`}
    >
      {/* ─────────────────────────────────────────────
          1. HEADER SECTION
          ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Border Profil Mewah
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                8 Pilihan
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tampil elegan mengelilingi foto profil di semua layar scoreboard
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          2. LIVE PREVIEW BESAR DI ATAS GRID
          ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-amber-50/30 dark:from-slate-850 dark:via-slate-900 dark:to-amber-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Avatar Preview Besar */}
        <div className="relative py-2 px-3 flex items-center justify-center shrink-0">
          <Avatar
            id={player.id}
            name={player.name}
            color={player.color}
            photoVersion={player.photoVersion}
            borderId={selectedBorder}
            size="xl"
          />
        </div>

        {/* Informasi Detail Border yang Sedang Dipilih */}
        <div className="flex flex-col text-center sm:text-left min-w-0 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              {currentBorderInfo.name}
            </span>
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: `${currentBorderInfo.accentColor}20`,
                color: currentBorderInfo.accentColor,
                border: `1px solid ${currentBorderInfo.accentColor}40`,
              }}
            >
              {currentBorderInfo.badge}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
            {currentBorderInfo.description}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Foto profil asli tetap utuh dan tidak terpotong</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. GRID KARTU PILIHAN BORDER (2 col mobile, 4 col desktop)
          ───────────────────────────────────────────── */}
      <div
        role="radiogroup"
        aria-label="Pilihan Bingkai Avatar"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {BORDER_LIST.map((b, idx) => {
          const isSelected = selectedBorder === b.id;
          const isCurrentSaved = initialBorder === b.id;

          return (
            <button
              key={b.id ?? 'none'}
              id={`pfb-option-${idx}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedBorder(b.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative flex flex-col items-center p-3.5 rounded-2xl text-center select-none cursor-pointer transition-all duration-200 group outline-none ${
                isSelected
                  ? 'bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500 shadow-md shadow-amber-500/10 -translate-y-0.5'
                  : 'bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-500/40 hover:-translate-y-0.5 hover:shadow-sm'
              } focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
            >
              {/* Badge Terpilih / Saat Ini */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {isCurrentSaved && !isSelected && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    title="Border aktif saat ini"
                  />
                )}
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Preview Avatar Ukuran Sedang dengan Border */}
              <div className="my-2 py-1 flex items-center justify-center">
                <Avatar
                  id={player.id}
                  name={player.name}
                  color={player.color}
                  photoVersion={player.photoVersion}
                  borderId={b.id}
                  size="md"
                />
              </div>

              {/* Label & Badge */}
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight mt-1 truncate w-full">
                {b.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {b.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────
          4. ACTION BUTTONS: SIMPAN BORDER & RESET
          ───────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanged || isSaving}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all w-full sm:w-auto ${
            hasChanged && !isSaving
              ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60'
          }`}
        >
          <RotateCcw size={14} />
          <span>Reset Pilihan</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanged || isSaving}
            className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-2xl text-xs font-black shadow-md transition-all w-full sm:w-auto ${
              hasChanged && !isSaving
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-white hover:brightness-110 active:scale-95 shadow-amber-500/25'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Sparkles size={15} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Border'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

