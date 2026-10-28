'use client';

/**
 * Komponen Tabel Riwayat Round:
 * - Menampilkan skor per round tiap pemain (bisa scroll horizontal di HP)
 * - Baris terakhir menampilkan Total Skor
 * - Tombol Edit dan Hapus tiap round
 * - Tombol Undo untuk round terakhir
 */

import React, { useState } from 'react';
import { Edit2, Trash2, RotateCcw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';

interface PlayerInfo {
  id: number;
  name: string;
  color: string;
}

interface RoundItem {
  roundNo: number;
  scores: Record<number, number>;
}

interface RoundHistoryTableProps {
  players: PlayerInfo[];
  rounds: RoundItem[];
  totals: Record<number, number>;
  onEditRound: (roundNo: number, scores: Record<number, number>) => Promise<any>;
  onDeleteRound: (roundNo: number) => Promise<any>;
  isZeroSum?: boolean;
  roundResets?: Record<number, number[]>;
}

export function RoundHistoryTable({
  players,
  rounds,
  totals,
  onEditRound,
  onDeleteRound,
  isZeroSum,
  roundResets,
}: RoundHistoryTableProps) {
  const [editingRound, setEditingRound] = useState<RoundItem | null>(null);
  const [editScores, setEditScores] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buka modal edit untuk round tertentu
  const startEdit = (round: RoundItem) => {
    setEditingRound(round);
    setEditScores({ ...round.scores });
  };

  const handleScoreChange = (playerId: number, valueStr: string) => {
    const val = parseInt(valueStr, 10);
    setEditScores((prev) => ({
      ...prev,
      [playerId]: isNaN(val) ? 0 : val,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingRound) return;

    if (isZeroSum) {
      const sum = Object.values(editScores).reduce((a, b) => a + b, 0);
      if (sum !== 0) {
        toast.error(`Mode zero-sum: total skor harus 0 (saat ini ${sum > 0 ? '+' : ''}${sum})`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onEditRound(editingRound.roundNo, editScores);
      toast.success(`Round ${editingRound.roundNo} berhasil diperbarui`);
      setEditingRound(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (roundNo: number) => {
    if (confirm(`Hapus Round ${roundNo}?`)) {
      try {
        await onDeleteRound(roundNo);
        toast.success(`Round ${roundNo} dihapus`);
      } catch (err: any) {
        toast.error(err.message || 'Gagal menghapus round');
      }
    }
  };

  const sortedRounds = [...rounds].sort((a, b) => b.roundNo - a.roundNo); // Terbaru di atas
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

  return (
    <div className="glass-card p-4 sm:p-6 overflow-hidden">
      {/* Header Tabel & Tombol Undo */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Riwayat Round
          </h3>
          <p className="text-xs text-slate-400">
            {rounds.length === 0
              ? 'Belum ada round yang dimainkan'
              : `${rounds.length} round telah selesai`}
          </p>
        </div>

        {lastRound && (
          <button
            type="button"
            onClick={() => handleDelete(lastRound.roundNo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95"
            title="Batalkan round terakhir (Ctrl+Z)"
          >
            <RotateCcw size={14} />
            <span>Undo Round {lastRound.roundNo}</span>
          </button>
        )}
      </div>

      {rounds.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          Masukkan nilai di atas lalu klik &ldquo;Simpan Round&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase font-bold">
                <th className="py-2.5 px-3 w-16">Round</th>
                {players.map((p) => (
                  <th key={p.id} className="py-2.5 px-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate max-w-[100px]">{p.name}</span>
                    </span>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sortedRounds.map((r) => (
                <tr
                  key={r.roundNo}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400">
                    #{r.roundNo}
                  </td>
                  {players.map((p) => {
                    const score = r.scores[p.id] ?? 0;
                    const isReset = roundResets?.[r.roundNo]?.includes(p.id);
                    return (
                      <td
                        key={p.id}
                        className={`py-2.5 px-3 font-semibold tabular-nums ${
                          score > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : score < 0
                            ? 'text-rose-500'
                            : 'text-slate-400'
                        }`}
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span>{score > 0 ? `+${score}` : score}</span>
                          {isReset && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/15 text-rose-500 dark:bg-rose-500/25 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap"
                              title="Skor hangus menjadi 0 karena terbalap lawan selisih >= 5 poin"
                            >
                              💥 Jadi 0
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit round ini"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.roundNo)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Hapus round ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Baris Total */}
            <tfoot>
              <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850/60 font-extrabold">
                <td className="py-3 px-3 uppercase text-xs tracking-wider text-slate-500">
                  Total
                </td>
                {players.map((p) => {
                  const total = totals[p.id] ?? 0;
                  return (
                    <td
                      key={p.id}
                      className={`py-3 px-3 text-base tabular-nums ${
                        total > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : total < 0
                          ? 'text-rose-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {total}
                    </td>
                  );
                })}
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal Edit Round */}
      <Modal
        isOpen={Boolean(editingRound)}
        onClose={() => setEditingRound(null)}
        title={`Edit Round #${editingRound?.roundNo}`}
        description="Ubah skor pemain pada round ini"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 mt-2">
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                  {p.name}
                </span>
              </div>
              <input
                type="number"
                value={editScores[p.id] ?? 0}
                onChange={(e) => handleScoreChange(p.id, e.target.value)}
                className="w-24 text-center font-bold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 tabular-nums text-sm"
              />
            </div>
          ))}

          {isZeroSum && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold text-center">
              Total skor round saat ini:{' '}
              <span className="font-bold">
                {Object.values(editScores).reduce((a, b) => a + b, 0)}
              </span>{' '}
              (harus 0)
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingRound(null)}
              disabled={isSubmitting}
              className="btn-secondary py-2 px-4 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="btn-primary py-2 px-4 text-xs font-semibold"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
