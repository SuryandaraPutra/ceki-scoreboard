'use client';

/**
 * Komponen Kartu Pemain di Layar Game:
 * - Menampilkan Avatar, Nama, Medali Peringkat, Total Skor
 * - Progress bar menuju batas skor tertinggi (hijau, kuning >=80%, merah 100%, badge 🏁)
 * - Kontrol skor round berjalan: tombol -/+, chip nilai cepat, dan input angka langsung
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { Minus, Plus, Flag } from 'lucide-react';
import { vibrate, getProgressColor } from '@/lib/constants';

interface ScoreCardProps {
  player: {
    id: number;
    name: string;
    color: string;
    photoVersion: number;
    seatOrder: number;
    totalScore: number;
    rank: number;
    progress: number;
    hasReachedLimit: boolean;
  };
  currentRoundScore: number;
  onScoreChange: (score: number) => void;
  quickValues: number[];
  scoreLimit: number | null;
  winCondition: 'highest' | 'lowest';
}

const medalIcons = ['🥇', '🥈', '🥉', '4️⃣'];

export function ScoreCard({
  player,
  currentRoundScore,
  onScoreChange,
  quickValues,
  scoreLimit,
}: ScoreCardProps) {
  // Tambah/kurang skor
  const adjustScore = (delta: number) => {
    vibrate(40);
    onScoreChange(currentRoundScore + delta);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || val === '-') {
      onScoreChange(0);
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      onScoreChange(parsed);
    }
  };

  const rankMedal = medalIcons[player.rank - 1] ?? `${player.rank}`;

  return (
    <motion.div
      layout
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`glass-card p-4 sm:p-5 relative flex flex-col justify-between overflow-hidden border-2 transition-shadow ${
        player.hasReachedLimit
          ? 'border-rose-500 shadow-rose-500/20'
          : player.rank === 1
          ? 'border-amber-400/80 shadow-amber-400/15'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
      style={{
        boxShadow: `0 4px 20px ${player.color}15`,
      }}
    >
      {/* Header Kartu: Peringkat, Avatar, Nama, dan Badge Batas */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <Avatar
              id={player.id}
              name={player.name}
              color={player.color}
              photoVersion={player.photoVersion}
              size="md"
            />
            {/* Medali Peringkat */}
            <span className="absolute -top-1.5 -left-1.5 text-base drop-shadow-md">
              {rankMedal}
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
              {player.name}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Kursi {player.seatOrder + 1}
            </span>
          </div>
        </div>

        {/* Badge jika menyentuh batas skor */}
        {player.hasReachedLimit && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold tracking-wider animate-bounce-soft shrink-0">
            <Flag size={12} />
            <span>BATAS!</span>
          </div>
        )}
      </div>

      {/* Total Skor & Progress Bar Batas */}
      <div className="bg-slate-100/70 dark:bg-slate-850/70 rounded-2xl p-3 mb-3 border border-slate-200/40 dark:border-slate-750">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Total Skor
          </span>
          <span
            className={`text-2xl sm:text-3xl font-black tabular-nums transition-transform ${
              player.totalScore > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : player.totalScore < 0
                ? 'text-rose-500'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {player.totalScore}
          </span>
        </div>

        {/* Progress Bar menuju Batas Skor */}
        {scoreLimit && (
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
              <span>Batas {scoreLimit}</span>
              <span>{Math.round(player.progress * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                  player.progress
                )}`}
                style={{ width: `${Math.min(player.progress * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Kontrol Input Skor Round Berjalan */}
      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Skor Round Ini:</span>
          {currentRoundScore !== 0 && (
            <button
              type="button"
              onClick={() => onScoreChange(0)}
              className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold"
            >
              Reset
            </button>
          )}
        </div>

        {/* Baris Tombol - / + dan Input Manual */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => adjustScore(-1)}
            className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 active:scale-90 flex items-center justify-center transition-all shrink-0"
            title="Kurangi 1"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>

          <input
            type="number"
            value={currentRoundScore === 0 ? '' : currentRoundScore}
            onChange={handleInputChange}
            placeholder="0"
            className="flex-1 h-10 text-center font-extrabold text-base rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:outline-none tabular-nums text-slate-900 dark:text-slate-100"
          />

          <button
            type="button"
            onClick={() => adjustScore(1)}
            className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 active:scale-90 flex items-center justify-center transition-all shrink-0"
            title="Tambah 1"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Chip Nilai Cepat (+ dan -) */}
        <div className="grid grid-cols-4 gap-1 mt-0.5">
          {quickValues.slice(0, 4).map((val) => (
            <div key={val} className="flex gap-0.5">
              <button
                type="button"
                onClick={() => adjustScore(-val)}
                className="flex-1 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-90 text-[11px] font-extrabold transition-all"
                title={`-${val}`}
              >
                -{val}
              </button>
              <button
                type="button"
                onClick={() => adjustScore(val)}
                className="flex-1 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-90 text-[11px] font-extrabold transition-all"
                title={`+${val}`}
              >
                +{val}
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
