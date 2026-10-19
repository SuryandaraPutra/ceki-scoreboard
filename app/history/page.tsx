'use client';

/**
 * Halaman Riwayat Permainan (/history):
 * - Menampilkan daftar seluruh game yang telah selesai
 * - Detail skor 4 pemain dan badge pemenang
 * - Modal detail skor round-by-round
 * - Hapus game dengan dialog konfirmasi
 */

import React, { useState } from 'react';
import useSWR from 'swr';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate, formatDateTime } from '@/lib/constants';
import { History, Eye, Trash2, Calendar, Trophy, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HistoryPage() {
  const { data, isLoading, mutate } = useSWR('/api/games?status=finished', fetcher);
  const gamesList = data?.data ?? [];

  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [deleteTargetGame, setDeleteTargetGame] = useState<{ id: number; name: string | null } | null>(null);

  // Ambil detail game yang dipilih untuk modal
  const { data: detailData, isLoading: isDetailLoading } = useSWR(
    selectedGameId ? `/api/games/${selectedGameId}` : null,
    fetcher
  );

  const selectedGame = detailData?.data;

  const handleDeleteGame = async () => {
    if (!deleteTargetGame) return;
    try {
      const res = await fetch(`/api/games/${deleteTargetGame.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal menghapus game');
      }
      toast.success('Game berhasil dihapus dari riwayat');
      await mutate();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus game');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>Riwayat Game</span>
          <History size={24} className="text-emerald-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Daftar seluruh permainan kartu Ceki yang telah diselesaikan
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl skeleton" />
          ))}
        </div>
      ) : gamesList.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <History size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Riwayat Permainan
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Setelah menyelesaikan permainan, hasil game dan rincian skor per round akan tersimpan rapi di sini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {gamesList.map((game: any) => {
            return (
              <div
                key={game.id}
                className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedGameId(game.id)}
              >
                {/* Info Game & Tanggal */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
                      {game.name || `Game #${game.id}`}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold shrink-0">
                      {game.totalRounds} Round
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{formatDate(game.finishedAt || game.createdAt)}</span>
                  </span>
                </div>

                {/* 4 Pemain & Skor Akhir */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 flex-1 max-w-md">
                  {game.players.map((p: any) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded-2xl flex flex-col items-center text-center transition-all ${
                        p.isWinner
                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100/50 dark:bg-slate-850/50'
                      }`}
                    >
                      <div className="relative mb-1">
                        <Avatar
                          id={p.id}
                          name={p.name}
                          color={p.color}
                          photoVersion={p.photoVersion}
                          size="sm"
                        />
                        {p.isWinner && (
                          <span className="absolute -top-1 -right-1 text-xs">👑</span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                        {p.name}
                      </span>
                      <span
                        className={`text-xs font-black tabular-nums mt-0.5 ${
                          p.isWinner
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {p.totalScore}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tombol Aksi */}
                <div
                  className="flex items-center gap-1 justify-end shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedGameId(game.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Lihat Detail Round"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetGame({ id: game.id, name: game.name })}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Hapus Game dari Riwayat"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-700 hidden sm:block ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETAIL ROUND-BY-ROUND */}
      <Modal
        isOpen={Boolean(selectedGameId)}
        onClose={() => setSelectedGameId(null)}
        title={selectedGame?.name || `Detail Game #${selectedGameId}`}
        description={
          selectedGame
            ? `${formatDateTime(selectedGame.finishedAt || selectedGame.createdAt)} • ${
                selectedGame.rounds.length
              } Round`
            : 'Memuat data...'
        }
        maxWidth="lg"
      >
        {isDetailLoading || !selectedGame ? (
          <div className="h-48 rounded-2xl skeleton my-2" />
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {/* Tabel Skor Round Detail */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                    <th className="py-2 px-2.5 w-16">Round</th>
                    {selectedGame.players.map((p: any) => (
                      <th key={p.id} className="py-2 px-2.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate max-w-[90px]">{p.name}</span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {selectedGame.rounds.map((r: any) => (
                    <tr key={r.roundNo} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                      <td className="py-2 px-2.5 font-bold text-slate-400">
                        #{r.roundNo}
                      </td>
                      {selectedGame.players.map((p: any) => {
                        const score = r.scores[p.id] ?? 0;
                        return (
                          <td
                            key={p.id}
                            className={`py-2 px-2.5 tabular-nums ${
                              score > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : score < 0
                                ? 'text-rose-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {score > 0 ? `+${score}` : score}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 font-black">
                    <td className="py-2.5 px-2.5 uppercase text-[11px] text-slate-400">
                      Total
                    </td>
                    {selectedGame.players.map((p: any) => (
                      <td
                        key={p.id}
                        className={`py-2.5 px-2.5 text-sm tabular-nums ${
                          p.rank === 1
                            ? 'text-amber-500 font-black'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {p.totalScore} {p.rank === 1 && '👑'}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedGameId(null)}
                className="btn-secondary py-2 px-5 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DIALOG KONFIRMASI HAPUS GAME */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetGame)}
        onClose={() => setDeleteTargetGame(null)}
        onConfirm={handleDeleteGame}
        title="Hapus Game dari Riwayat?"
        message={`Game #${deleteTargetGame?.id} ${
          deleteTargetGame?.name ? `("${deleteTargetGame.name}")` : ''
        } beserta seluruh round dan skornya akan dihapus permanen.`}
        confirmText="Hapus Permanen"
        isDanger
      />
    </div>
  );
}
