'use client';

/**
 * Komponen Mode Layar Meja (Table Screen & TV Spectator Mode):
 * - Dirancang khusus saat HP/tablet ditaruh mendatar di tengah meja 4 pemain,
 *   atau di-cast ke layar TV/proyektor.
 * - Dua Mode Tampilan:
 *   1. "Formasi 4 Arah Meja" (Table View): 4 pemain di 4 sisi layar (Utara, Selatan, Barat, Timur)
 *      dengan orientasi teks yang bisa diputar 180° agar terbaca tegak oleh pemain yang duduk berhadapan.
 *   2. "Format Papan TV Lebar" (TV Spectator View): 4 kolom vertikal jumbo dengan angka raksasa.
 * - Kontrol skor cepat (+/- 5, 15, 25), validasi zero-sum real-time di tengah meja, dan simpan round.
 * - Dukungan Layar Penuh (Native Fullscreen API) & Screen Wake Lock agar layar tidak pernah mati.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vibrate, getProgressColor } from '@/lib/constants';
import { Avatar } from '../ui/Avatar';
import {
  Tv,
  Maximize2,
  Minimize2,
  X,
  RotateCw,
  Minus,
  Plus,
  Undo2,
  Check,
  Flag,
  Flame,
  LayoutGrid,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlayerInfo {
  id: number;
  name: string;
  color: string;
  photoVersion: number;
  seatOrder: number;
  totalScore: number;
  rank: number;
  progress: number;
  hasReachedLimit: boolean;
}

interface TableScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: {
    id: number;
    name?: string | null;
    room?: string;
    rounds: any[];
    players: PlayerInfo[];
    quickValues: number[];
    scoreLimit: number | null;
    winCondition: 'highest' | 'lowest';
    zeroSum: boolean;
  };
  currentRoundScores: Record<number, number>;
  onScoreChange: (playerId: number, score: number) => void;
  onSaveRound: () => Promise<void>;
  onUndo: () => Promise<void>;
  isSaving: boolean;
}

const medalIcons = ['🥇', '🥈', '🥉', '4️⃣'];

export function TableScreenModal({
  isOpen,
  onClose,
  game,
  currentRoundScores,
  onScoreChange,
  onSaveRound,
  onUndo,
  isSaving,
}: TableScreenModalProps) {
  // Mode tampilan: 'table' (4 arah meja) atau 'tv' (4 kolom jumbo)
  const [layoutMode, setLayoutMode] = useState<'table' | 'tv'>('table');
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Rotasi teks untuk pemain di seberang (agar Kursi 3 terbaca tegak dari sisi lawan)
  const [isFlippedOpposite, setIsFlippedOpposite] = useState(true);

  // Hitung total selisih round berjalan
  const roundSum = useMemo(() => {
    return Object.values(currentRoundScores).reduce((acc, s) => acc + s, 0);
  }, [currentRoundScores]);

  const isZeroSumValid = !game.zeroSum || roundSum === 0;

  // Toggle Layar Penuh Native
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Abaikan jika browser membatasi
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Shortcut tombol Escape untuk menutup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Tambah/kurang skor
  const adjustScore = (playerId: number, delta: number) => {
    vibrate(40);
    const curr = currentRoundScores[playerId] ?? 0;
    onScoreChange(playerId, curr + delta);
  };

  if (!isOpen) return null;

  // Urutkan pemain berdasarkan kursi (0, 1, 2, 3)
  const seatedPlayers = [...game.players].sort((a, b) => a.seatOrder - b.seatOrder);

  // Kursi 0 = Bawah (Selatan)
  // Kursi 1 = Kanan (Timur)
  // Kursi 2 = Atas (Utara - Berhadapan)
  // Kursi 3 = Kiri (Barat)
  const pBottom = seatedPlayers[0];
  const pRight = seatedPlayers[1];
  const pTop = seatedPlayers[2];
  const pLeft = seatedPlayers[3];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none"
      >
        {/* Latar Belakang Ambien Meja Karpet Hijau / Gelap */}
        <div className="absolute inset-0 bg-radial from-emerald-950/40 via-slate-950 to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* ─────────────────────────────────────────────
            BAR KONTROL ATAS (HEADER)
            ───────────────────────────────────────────── */}
        <header className="relative z-20 h-14 px-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-sm tracking-tight text-emerald-400">
                LAYAR MEJA {game.room ? `• MEJA ${game.room}` : ''}
              </span>
            </div>
            <span className="text-white/20">•</span>
            <span className="text-xs font-bold text-slate-300 truncate max-w-[140px] sm:max-w-xs">
              {game.name || `Game #${game.id}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Toggle Mode: Meja 4 Arah vs TV */}
            <div className="flex p-0.5 rounded-xl bg-white/10 border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLayoutMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  layoutMode === 'table'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format 4 Arah Mengelilingi Meja"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Meja 4 Arah</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('tv')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  layoutMode === 'tv'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format TV / 4 Kolom Jumbo"
              >
                <Tv size={13} />
                <span className="hidden sm:inline">Format TV</span>
              </button>
            </div>

            {/* Toggle Rotasi Teks Hadap-Hadapan (khusus mode meja) */}
            {layoutMode === 'table' && (
              <button
                type="button"
                onClick={() => setIsFlippedOpposite(!isFlippedOpposite)}
                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                  isFlippedOpposite
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-white/10 text-slate-400 border-white/10 hover:text-white'
                }`}
                title="Putar teks sisi lawan 180° agar terbaca tegak oleh pemain seberang"
              >
                <RotateCw size={15} />
              </button>
            )}

            {/* Tombol Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Masuk Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all active:scale-95"
              title="Kembali ke Layar Skor Biasa"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ─────────────────────────────────────────────
            BODY LAYAR MEJA
            ───────────────────────────────────────────── */}
        <div className="relative z-10 flex-1 flex flex-col overflow-auto p-2 sm:p-4">
          {layoutMode === 'table' ? (
            /* ========================================================
               MODE 1: FORMASI MEJA 4 ARAH (CENTER OF TABLE)
               ======================================================== */
            <div className="w-full h-full max-w-5xl mx-auto grid grid-rows-[1fr_auto_1fr] grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-stretch justify-items-stretch min-h-[520px]">
              {/* SISI ATAS: KURSI 3 (UTARA - BERHADAPAN) */}
              <div
                className={`col-start-2 row-start-1 flex justify-center items-end pb-1 ${
                  isFlippedOpposite ? 'rotate-180' : ''
                }`}
              >
                {pTop && (
                  <TablePlayerPod
                    player={pTop}
                    roundScore={currentRoundScores[pTop.id] ?? 0}
                    onAdjust={(delta) => adjustScore(pTop.id, delta)}
                    quickValues={game.quickValues}
                    position="top"
                  />
                )}
              </div>

              {/* SISI KIRI: KURSI 4 (BARAT) */}
              <div className="col-start-1 row-start-2 flex items-center justify-end pr-1">
                {pLeft && (
                  <TablePlayerPod
                    player={pLeft}
                    roundScore={currentRoundScores[pLeft.id] ?? 0}
                    onAdjust={(delta) => adjustScore(pLeft.id, delta)}
                    quickValues={game.quickValues}
                    position="left"
                  />
                )}
              </div>

              {/* ─────────────────────────────────────────────
                  PUSAT MEJA (CENTER HUB): STATUS ROUND & SIMPAN
                  ───────────────────────────────────────────── */}
              <div className="col-start-2 row-start-2 flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950 backdrop-blur-xl max-w-xs mx-auto text-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                    ROUND BERJALAN
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    #{game.rounds.length + 1}
                  </span>
                  {game.scoreLimit && (
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      Target Skor: {game.scoreLimit}
                    </span>
                  )}
                </div>

                {/* Selisih Round Ini (Zero-sum indicator) */}
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${
                    isZeroSumValid
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  }`}
                >
                  <span>Selisih: {roundSum > 0 ? `+${roundSum}` : roundSum}</span>
                  {isZeroSumValid && <Check size={14} />}
                </div>

                {/* Tombol Simpan Round */}
                <button
                  type="button"
                  onClick={onSaveRound}
                  disabled={isSaving || (game.zeroSum && roundSum !== 0)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Check size={18} strokeWidth={3} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Round'}</span>
                </button>

                {/* Tombol Undo */}
                {game.rounds.length > 0 && (
                  <button
                    type="button"
                    onClick={onUndo}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    <Undo2 size={13} />
                    <span>Undo Round #{game.rounds.length}</span>
                  </button>
                )}
              </div>

              {/* SISI KANAN: KURSI 2 (TIMUR) */}
              <div className="col-start-3 row-start-2 flex items-center justify-start pl-1">
                {pRight && (
                  <TablePlayerPod
                    player={pRight}
                    roundScore={currentRoundScores[pRight.id] ?? 0}
                    onAdjust={(delta) => adjustScore(pRight.id, delta)}
                    quickValues={game.quickValues}
                    position="right"
                  />
                )}
              </div>

              {/* SISI BAWAH: KURSI 1 (SELATAN) */}
              <div className="col-start-2 row-start-3 flex justify-center items-start pt-1">
                {pBottom && (
                  <TablePlayerPod
                    player={pBottom}
                    roundScore={currentRoundScores[pBottom.id] ?? 0}
                    onAdjust={(delta) => adjustScore(pBottom.id, delta)}
                    quickValues={game.quickValues}
                    position="bottom"
                  />
                )}
              </div>
            </div>
          ) : (
            /* ========================================================
               MODE 2: FORMAT TV (4 KOLOM JUMBO BERDAMPINGAN)
               ======================================================== */
            <div className="w-full h-full max-w-7xl mx-auto flex flex-col justify-between gap-4">
              {/* 4 Kolom Pemain Jumbo */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 items-stretch">
                {seatedPlayers.map((player) => {
                  const roundScore = currentRoundScores[player.id] ?? 0;
                  const rankMedal = medalIcons[player.rank - 1] ?? `${player.rank}`;

                  return (
                    <div
                      key={player.id}
                      className={`relative flex flex-col justify-between p-4 sm:p-6 rounded-3xl border-2 transition-all overflow-hidden ${
                        player.hasReachedLimit
                          ? 'border-rose-500 bg-rose-950/40 shadow-xl shadow-rose-500/20'
                          : player.rank === 1
                          ? 'border-amber-400/80 bg-amber-950/20 shadow-xl shadow-amber-400/10'
                          : 'border-white/10 bg-slate-900/60 shadow-lg'
                      }`}
                      style={{
                        boxShadow: `0 8px 32px ${player.color}20`,
                      }}
                    >
                      {/* Header Kolom */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <Avatar
                              id={player.id}
                              name={player.name}
                              color={player.color}
                              photoVersion={player.photoVersion}
                              size="md"
                            />
                            <span className="absolute -top-2 -left-2 text-lg">
                              {rankMedal}
                            </span>
                          </div>
                          <div>
                            <span className="font-black text-sm sm:text-base text-white block truncate max-w-[110px] sm:max-w-[150px]">
                              {player.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Kursi {player.seatOrder + 1}
                            </span>
                          </div>
                        </div>

                        {player.hasReachedLimit && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-bounce-soft">
                            BATAS!
                          </span>
                        )}
                      </div>

                      {/* SKOR JUMBO */}
                      <div className="my-auto py-4 text-center">
                        <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase block mb-1">
                          TOTAL SKOR
                        </span>
                        <span
                          className={`text-5xl sm:text-6xl font-black tabular-nums transition-transform ${
                            player.totalScore > 0
                              ? 'text-emerald-400'
                              : player.totalScore < 0
                              ? 'text-rose-400'
                              : 'text-white'
                          }`}
                        >
                          {player.totalScore}
                        </span>

                        {/* Progress bar batas */}
                        {game.scoreLimit && (
                          <div className="w-full mt-3">
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                                  player.progress
                                )}`}
                                style={{ width: `${Math.min(player.progress * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                              {Math.round(player.progress * 100)}% menuju {game.scoreLimit}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Kontrol Input Round di Kolom TV */}
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Round Ini:</span>
                          <span
                            className={`text-base font-black tabular-nums ${
                              roundScore > 0
                                ? 'text-emerald-400'
                                : roundScore < 0
                                ? 'text-rose-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {roundScore > 0 ? `+${roundScore}` : roundScore}
                          </span>
                        </div>

                        {/* Tombol Cepat 5, 15, 25 */}
                        <div className="grid grid-cols-3 gap-1">
                          {game.quickValues.slice(0, 3).map((val) => (
                            <div key={val} className="flex gap-0.5">
                              <button
                                type="button"
                                onClick={() => adjustScore(player.id, -val)}
                                className="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 active:scale-90 text-xs font-black transition-all"
                              >
                                -{val}
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustScore(player.id, val)}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 active:scale-90 text-xs font-black transition-all"
                              >
                                +{val}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bar Simpan Round Bawah di Mode TV */}
              <div className="p-4 rounded-3xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-2xl bg-white/10 text-white font-black text-sm">
                    ROUND #{game.rounds.length + 1}
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${
                      isZeroSumValid
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    <span>Total Selisih: {roundSum > 0 ? `+${roundSum}` : roundSum}</span>
                    {isZeroSumValid && <Check size={14} />}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {game.rounds.length > 0 && (
                    <button
                      type="button"
                      onClick={onUndo}
                      className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Undo2 size={15} />
                      <span>Undo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onSaveRound}
                    disabled={isSaving || (game.zeroSum && roundSum !== 0)}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Round'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Pod Pemain Khusus Mode Meja 4 Arah
 */
function TablePlayerPod({
  player,
  roundScore,
  onAdjust,
  quickValues,
  position,
}: {
  player: PlayerInfo;
  roundScore: number;
  onAdjust: (delta: number) => void;
  quickValues: number[];
  position: 'top' | 'bottom' | 'left' | 'right';
}) {
  const medal = medalIcons[player.rank - 1] ?? `${player.rank}`;

  return (
    <div
      className="p-3 rounded-2xl bg-slate-900/85 border border-white/15 shadow-xl backdrop-blur-md flex flex-col items-center gap-2 w-52 sm:w-60 transition-all hover:border-emerald-500/50"
      style={{
        boxShadow: `0 4px 20px ${player.color}25`,
      }}
    >
      {/* Header Pod: Avatar, Nama, Peringkat */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <Avatar
              id={player.id}
              name={player.name}
              color={player.color}
              photoVersion={player.photoVersion}
              size="sm"
            />
            <span className="absolute -top-1.5 -left-1.5 text-xs">{medal}</span>
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-xs text-white truncate block">
              {player.name}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              Kursi {player.seatOrder + 1}
            </span>
          </div>
        </div>

        {/* Skor Total */}
        <div className="text-right">
          <span
            className={`text-xl sm:text-2xl font-black tabular-nums ${
              player.totalScore > 0
                ? 'text-emerald-400'
                : player.totalScore < 0
                ? 'text-rose-400'
                : 'text-white'
            }`}
          >
            {player.totalScore}
          </span>
        </div>
      </div>

      {/* Baris Skor Round Ini & Tombol Cepat */}
      <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-white/10">
        <div className="text-left shrink-0">
          <span className="text-[9px] text-slate-400 block -mb-0.5">Round:</span>
          <span
            className={`text-xs font-black tabular-nums ${
              roundScore > 0
                ? 'text-emerald-400'
                : roundScore < 0
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {roundScore > 0 ? `+${roundScore}` : roundScore}
          </span>
        </div>

        {/* Pasang Tombol 5, 15, 25 */}
        <div className="flex gap-1">
          {quickValues.slice(0, 3).map((val) => (
            <div key={val} className="flex gap-0.5">
              <button
                type="button"
                onClick={() => onAdjust(-val)}
                className="px-1.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px] font-black active:scale-90 transition-all"
              >
                -{val}
              </button>
              <button
                type="button"
                onClick={() => onAdjust(val)}
                className="px-1.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[10px] font-black active:scale-90 transition-all"
              >
                +{val}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
