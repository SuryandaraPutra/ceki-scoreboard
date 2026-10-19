'use client';

/**
 * Modal Podium Pemenang Game dengan Confetti:
 * - Menampilkan podium juara 1, 2, 3 (dan 4) lengkap dengan foto & medali
 * - Animasi ledakan confetti otomatis saat dibuka
 * - Tombol "Bagikan Hasil" via Web Share API / WhatsApp / Clipboard
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Trophy, Share2, PlusCircle, Check } from 'lucide-react';
import { shareOrCopy } from '@/lib/constants';
import { toast } from 'sonner';

interface PlayerScore {
  playerId: number;
  playerName: string;
  totalScore: number;
  rank: number;
}

interface GameWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string | null;
  players: PlayerScore[];
  playerColors: Record<number, string>;
  playerPhotoVersions: Record<number, number>;
  summaryText: string;
  onNewGame: () => void;
}

const medalSymbols = ['🥇', '🥈', '🥉', '4️⃣'];

export function GameWinnerModal({
  isOpen,
  onClose,
  gameName,
  players,
  playerColors,
  playerPhotoVersions,
  summaryText,
  onNewGame,
}: GameWinnerModalProps) {
  // Ledakkan confetti saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isOpen]);

  const handleShare = async () => {
    const success = await shareOrCopy(summaryText, 'Hasil Ceki Scoreboard');
    if (success) {
      toast.success('Ringkasan skor disalin / dibagikan!');
    } else {
      toast.error('Gagal menyalin ringkasan skor');
    }
  };

  // Urutkan berdasarkan rank
  const sorted = [...players].sort((a, b) => a.rank - b.rank);
  const winners = sorted.filter((p) => p.rank === 1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🏆 Permainan Selesai!"
      description={gameName ? `Game: ${gameName}` : 'Selamat kepada para pemenang!'}
      maxWidth="md"
    >
      <div className="flex flex-col items-center gap-5 mt-2">
        {/* Banner Pemenang */}
        <div className="w-full text-center py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border border-amber-300 dark:border-amber-700/60">
          <span className="text-xs uppercase font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">
            {winners.length > 1 ? '🎉 Seri di Peringkat 1!' : '👑 Juara 1'}
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
            {winners.map((w) => w.playerName).join(' & ')}
          </h2>
        </div>

        {/* Podium Top 3 */}
        <div className="grid grid-cols-3 gap-2 w-full pt-4 items-end">
          {/* Juara 2 (Kiri) */}
          {sorted[1] && (
            <div className="flex flex-col items-center">
              <span className="text-xl mb-1">{medalSymbols[1]}</span>
              <Avatar
                id={sorted[1].playerId}
                name={sorted[1].playerName}
                color={playerColors[sorted[1].playerId] || '#0ea5e9'}
                photoVersion={playerPhotoVersions[sorted[1].playerId] || 0}
                size="md"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-full text-center">
                {sorted[1].playerName}
              </span>
              <span className="text-xs font-black text-slate-500 tabular-nums">
                {sorted[1].totalScore}
              </span>
              <div className="w-full h-16 bg-slate-200/80 dark:bg-slate-800 rounded-t-2xl mt-2 flex items-center justify-center font-black text-slate-400">
                2
              </div>
            </div>
          )}

          {/* Juara 1 (Tengah - Lebih Tinggi) */}
          {sorted[0] && (
            <div className="flex flex-col items-center -mt-4">
              <span className="text-2xl mb-1 animate-bounce-soft">{medalSymbols[0]}</span>
              <Avatar
                id={sorted[0].playerId}
                name={sorted[0].playerName}
                color={playerColors[sorted[0].playerId] || '#10b981'}
                photoVersion={playerPhotoVersions[sorted[0].playerId] || 0}
                size="lg"
                className="ring-4 ring-amber-400"
              />
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 truncate max-w-full text-center">
                {sorted[0].playerName}
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {sorted[0].totalScore}
              </span>
              <div className="w-full h-24 bg-gradient-to-t from-amber-400 to-amber-300 dark:from-amber-600 dark:to-amber-500 rounded-t-2xl mt-2 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-amber-500/20">
                1
              </div>
            </div>
          )}

          {/* Juara 3 (Kanan) */}
          {sorted[2] && (
            <div className="flex flex-col items-center">
              <span className="text-xl mb-1">{medalSymbols[2]}</span>
              <Avatar
                id={sorted[2].playerId}
                name={sorted[2].playerName}
                color={playerColors[sorted[2].playerId] || '#f59e0b'}
                photoVersion={playerPhotoVersions[sorted[2].playerId] || 0}
                size="md"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-full text-center">
                {sorted[2].playerName}
              </span>
              <span className="text-xs font-black text-slate-500 tabular-nums">
                {sorted[2].totalScore}
              </span>
              <div className="w-full h-12 bg-slate-200/80 dark:bg-slate-800 rounded-t-2xl mt-2 flex items-center justify-center font-black text-slate-400">
                3
              </div>
            </div>
          )}
        </div>

        {/* Juara 4 (Baris Bawah) */}
        {sorted[3] && (
          <div className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-100/60 dark:bg-slate-850/60 border border-slate-200/40 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm">{medalSymbols[3]}</span>
              <Avatar
                id={sorted[3].playerId}
                name={sorted[3].playerName}
                color={playerColors[sorted[3].playerId] || '#94a3b8'}
                photoVersion={playerPhotoVersions[sorted[3].playerId] || 0}
                size="sm"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {sorted[3].playerName}
              </span>
            </div>
            <span className="text-xs font-black text-slate-500 tabular-nums">
              {sorted[3].totalScore} poin
            </span>
          </div>
        )}

        {/* Tombol Bagikan & Game Baru */}
        <div className="grid grid-cols-2 gap-3 w-full pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleShare}
            className="btn-secondary py-3 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Share2 size={16} />
            <span>Bagikan Hasil</span>
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="btn-primary py-3 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={16} />
            <span>Game Baru</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
