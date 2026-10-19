'use client';

/**
 * Modal untuk Mengatur Batas Skor Tertinggi & Aksinya di tengah game berjalan.
 * Meminta konfirmasi jika perubahan batas membuat salah satu pemain langsung menyentuh batas.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { SCORE_LIMIT_PRESETS } from '@/lib/constants';
import { Flag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScoreLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number | null;
  currentAction: 'notify' | 'ask' | 'auto';
  highestPlayerScore: number;
  onSave: (patch: {
    scoreLimit: number | null;
    scoreLimitAction: 'notify' | 'ask' | 'auto';
  }) => Promise<any>;
}

export function ScoreLimitModal({
  isOpen,
  onClose,
  currentLimit,
  currentAction,
  highestPlayerScore,
  onSave,
}: ScoreLimitModalProps) {
  const [limit, setLimit] = useState<string>(currentLimit ? String(currentLimit) : '');
  const [action, setAction] = useState<'notify' | 'ask' | 'auto'>(currentAction);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLimit(currentLimit ? String(currentLimit) : '');
    setAction(currentAction);
  }, [currentLimit, currentAction, isOpen]);

  const numericLimit = limit === '' ? null : parseInt(limit, 10);
  const willImmediatelyTrigger =
    numericLimit !== null && !isNaN(numericLimit) && highestPlayerScore >= numericLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (willImmediatelyTrigger) {
      const ok = confirm(
        `Perhatian: Skor pemain tertinggi saat ini (${highestPlayerScore}) sudah mencapai atau melebihi batas baru (${numericLimit}). Lanjutkan perubahan?`
      );
      if (!ok) return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        scoreLimit: numericLimit,
        scoreLimitAction: action,
      });
      toast.success('Batas skor berhasil diperbarui');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui batas skor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atur Batas Skor Tertinggi"
      description="Tentukan target batas skor dan aksi saat tercapai"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
        {/* Preset & Input Manual */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Preset Batas Skor
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => setLimit('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                limit === ''
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Tanpa Batas
            </button>
            {SCORE_LIMIT_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLimit(String(val))}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  limit === String(val)
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Atau ketik angka (1 - 99999)..."
              min={1}
              max={99999}
              className="input-field text-sm"
            />
          </div>
        </div>

        {/* Peringatan jika langsung terpicu */}
        {willImmediatelyTrigger && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Batas langsung tercapai!</p>
              <p className="mt-0.5">
                Skor tertinggi saat ini adalah {highestPlayerScore}. Mengubah batas ke {numericLimit} akan langsung mengaktifkan status batas tercapai.
              </p>
            </div>
          </div>
        )}

        {/* Aksi saat batas tercapai */}
        {limit !== '' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Aksi Saat Batas Tercapai
            </label>
            <div className="flex flex-col gap-2">
              {[
                {
                  id: 'ask',
                  title: 'Tanya Apakah Game Diakhiri (Default)',
                  desc: 'Menampilkan pesan konfirmasi setelah round disimpan',
                },
                {
                  id: 'notify',
                  title: 'Hanya Beri Tahu',
                  desc: 'Menampilkan banner & badge batas tercapai, game tetap lanjut',
                },
                {
                  id: 'auto',
                  title: 'Akhiri Otomatis',
                  desc: 'Game langsung otomatis diselesaikan begitu batas tercapai',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    action === opt.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <input
                    type="radio"
                    name="action"
                    value={opt.id}
                    checked={action === opt.id}
                    onChange={() => setAction(opt.id as any)}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {opt.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
            disabled={isSubmitting}
            className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-1.5"
          >
            <Flag size={14} />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Batas'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
