'use client';

/**
 * Halaman Utama (Dashboard / Layar Game Aktif):
 * - Jika tidak ada game aktif: Tampilkan tombol Mulai Game Baru & ringkasan
 * - Jika ada game aktif: Layar papan skor Ceki 4 pemain interaktif
 *   - 4 Kartu Pemain dengan animasi layout reorder, rank medali, progress bar batas
 *   - Kontrol +/- nilai cepat dan manual
 *   - Indikator selisih round (zero-sum validation)
 *   - Tabel riwayat round dengan horizontal scroll, edit, dan Undo
 *   - Screen Wake Lock API (layar tetap menyala di HP)
 *   - Keyboard shortcuts (Enter = Simpan Round, Ctrl+Z = Undo)
 *   - Modal atur batas skor, modal konfirmasi, dan modal podium pemenang + confetti
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActiveGame } from '@/hooks/useActiveGame';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ScoreCard } from '@/components/game/ScoreCard';
import { RoundHistoryTable } from '@/components/game/RoundHistoryTable';
import { ScoreLimitModal } from '@/components/game/ScoreLimitModal';
import { GameWinnerModal } from '@/components/game/GameWinnerModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Play,
  Flag,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Users,
  History,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const {
    game,
    isLoading,
    saveRound,
    updateRound,
    deleteRound,
    updateGameSettings,
    finishGame,
  } = useActiveGame();

  // Jaga layar HP tetap menyala selama game aktif
  useWakeLock(Boolean(game));

  // State skor round yang sedang diinput oleh pengguna: playerId -> skor
  const [currentRoundScores, setCurrentRoundScores] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // State Modal
  const [isScoreLimitModalOpen, setIsScoreLimitModalOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [winnerModalData, setWinnerModalData] = useState<{
    scores: any[];
    summaryText: string;
  } | null>(null);

  // Inisialisasi input skor round saat game dimuat
  useEffect(() => {
    if (game && game.players) {
      setCurrentRoundScores((prev) => {
        const next: Record<number, number> = {};
        for (const p of game.players) {
          next[p.id] = prev[p.id] ?? 0;
        }
        return next;
      });
    }
  }, [game]);

  // Handler ubah skor pemain pada round ini
  const handleScoreChange = useCallback((playerId: number, score: number) => {
    setCurrentRoundScores((prev) => ({
      ...prev,
      [playerId]: score,
    }));
  }, []);

  // Hitung total selisih round berjalan
  const roundSum = useMemo(() => {
    return Object.values(currentRoundScores).reduce((acc, s) => acc + s, 0);
  }, [currentRoundScores]);

  // Validasi zero-sum: jika aktif, total selisih harus 0
  const isZeroSumValid = !game?.zeroSum || roundSum === 0;

  // Cek apakah ada perubahan nilai round yang dimasukkan
  const hasInputScores = useMemo(() => {
    return Object.values(currentRoundScores).some((s) => s !== 0);
  }, [currentRoundScores]);

  // Simpan Round
  const handleSaveRound = useCallback(async () => {
    if (!game) return;

    if (!isOnline) {
      toast.error('Tidak dapat menyimpan round dalam keadaan offline');
      return;
    }

    if (game.zeroSum && roundSum !== 0) {
      toast.error(`Mode zero-sum: total skor harus 0 (saat ini ${roundSum > 0 ? '+' : ''}${roundSum})`);
      return;
    }

    try {
      setIsSaving(true);
      const res = await saveRound(currentRoundScores);

      // Reset input round
      const resetScores: Record<number, number> = {};
      for (const p of game.players) {
        resetScores[p.id] = 0;
      }
      setCurrentRoundScores(resetScores);

      toast.success(res?.message || 'Round berhasil disimpan!');

      // Jika batas skor tercapai dan aksinya 'ask', tanyakan ke pengguna
      if (res?.hasReachedScoreLimit && game.scoreLimitAction === 'ask') {
        setTimeout(() => {
          setIsFinishConfirmOpen(true);
        }, 500);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan round');
    } finally {
      setIsSaving(false);
    }
  }, [game, isOnline, roundSum, currentRoundScores, saveRound]);

  // Undo round terakhir
  const handleUndo = useCallback(async () => {
    if (!game || game.rounds.length === 0) return;
    const lastRound = game.rounds[game.rounds.length - 1];
    try {
      await deleteRound(lastRound.roundNo);
      toast.success(`Round ${lastRound.roundNo} dibatalkan`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal membatalkan round');
    }
  }, [game, deleteRound]);

  // Pintasan Keyboard Desktop: Enter = Simpan, Ctrl+Z = Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika user sedang mengetik di input field atau textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Enter -> Simpan Round
      if (e.key === 'Enter' && !isSaving && isZeroSumValid) {
        e.preventDefault();
        handleSaveRound();
      }

      // Ctrl+Z -> Undo Round Terakhir
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveRound, handleUndo, isSaving, isZeroSumValid]);

  // Akhiri Game & Buka Podium
  const handleFinishGame = async () => {
    try {
      const res = await finishGame();
      if (res?.data) {
        setWinnerModalData({
          scores: res.data.scores,
          summaryText: res.data.summaryText,
        });
        setIsWinnerModalOpen(true);
      }
      toast.success('Permainan selesai!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengakhiri game');
    }
  };

  // Skor tertinggi di antara pemain saat ini
  const highestCurrentScore = useMemo(() => {
    if (!game?.players || game.players.length === 0) return 0;
    return Math.max(...game.players.map((p) => p.totalScore));
  }, [game]);

  // Map warna dan photoVersion pemain untuk modal podium
  const playerColorsMap = useMemo(() => {
    const map: Record<number, string> = {};
    game?.players.forEach((p) => {
      map[p.id] = p.color;
    });
    return map;
  }, [game]);

  const playerPhotosMap = useMemo(() => {
    const map: Record<number, number> = {};
    game?.players.forEach((p) => {
      map[p.id] = p.photoVersion;
    });
    return map;
  }, [game]);

  const playerTotalsMap = useMemo(() => {
    const map: Record<number, number> = {};
    game?.players.forEach((p) => {
      map[p.id] = p.totalScore;
    });
    return map;
  }, [game]);

  // ─────────────────────────────────────────────
  // TAMPILAN JIKA TIDAK ADA GAME AKTIF
  // ─────────────────────────────────────────────
  if (!isLoading && !game) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-6 py-8 sm:py-16 animate-fade-in">
        {/* Banner Hero */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce-soft">
          <Play size={36} fill="currentColor" className="ml-1" />
        </div>

        <div className="glass-card p-6 sm:p-7 rounded-3xl max-w-md mx-auto shadow-xl">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            KOCOK KEKAR
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 font-medium">
            Papan hitung skor modern untuk permainan kartu Ceki 4 orang.
            Tersimpan otomatis, sinkron real-time, dan siap dipakai di HP maupun desktop.
          </p>
        </div>

        {/* Tombol Utama Mulai Game */}
        <Link
          href="/game/new"
          className="btn-primary py-4 px-8 text-base font-black flex items-center gap-2.5 shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
        >
          <Play size={20} fill="currentColor" />
          <span>Mulai Game Baru</span>
        </Link>

        {/* Pintasan Menu Lain */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-4">
          <Link
            href="/players"
            className="glass-card p-4 flex flex-col items-center gap-1.5 hover:border-emerald-500 transition-colors"
          >
            <Users size={22} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pemain
            </span>
          </Link>
          <Link
            href="/leaderboard"
            className="glass-card p-4 flex flex-col items-center gap-1.5 hover:border-amber-500 transition-colors"
          >
            <Trophy size={22} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Leaderboard
            </span>
          </Link>
          <Link
            href="/history"
            className="glass-card p-4 flex flex-col items-center gap-1.5 hover:border-sky-500 transition-colors"
          >
            <History size={22} className="text-sky-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Riwayat
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // TAMPILAN LOADING SKELETON
  // ─────────────────────────────────────────────
  if (isLoading || !game) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-16 rounded-3xl skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 rounded-3xl skeleton" />
          ))}
        </div>
        <div className="h-48 rounded-3xl skeleton" />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // TAMPILAN PAPAN SKOR GAME AKTIF
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Banner Notifikasi Batas Skor Tercapai */}
      {game.hasReachedScoreLimit && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-rose-500/15 via-rose-500/20 to-amber-500/15 border-2 border-rose-500/70 flex items-center justify-between gap-3 shadow-lg shadow-rose-500/10 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <Flag size={20} />
            </div>
            <div>
              <span className="font-black text-xs sm:text-sm text-rose-600 dark:text-rose-400 block">
                🏁 Batas Skor ({game.scoreLimit}) Telah Tercapai!
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pemain telah menyentuh batas target skor permainan.
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsFinishConfirmOpen(true)}
            className="btn-danger py-2 px-3 text-xs font-bold shrink-0"
          >
            Akhiri Game
          </button>
        </div>
      )}

      {/* Header Game Aktif */}
      <div className="glass-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {game.name || `Game #${game.id}`}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-semibold">
              Round berikutnya: #{game.rounds.length + 1}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Menang: {game.winCondition === 'highest' ? 'Tertinggi' : 'Terendah'}
            </span>
            {game.zeroSum && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                  Zero-Sum Aktif
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tombol Aksi Header */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setIsScoreLimitModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95"
            title="Ubah batas skor"
          >
            <Flag size={14} />
            <span>{game.scoreLimit ? `Batas: ${game.scoreLimit}` : 'Atur Batas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFinishConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Trophy size={14} />
            <span>Akhiri Game</span>
          </button>
        </div>
      </div>

      {/* 4 KARTU PEMAIN (2x2 di HP, 4 sejajar di Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {game.players.map((player) => (
          <ScoreCard
            key={player.id}
            player={player}
            currentRoundScore={currentRoundScores[player.id] ?? 0}
            onScoreChange={(score) => handleScoreChange(player.id, score)}
            quickValues={game.quickValues}
            scoreLimit={game.scoreLimit}
            winCondition={game.winCondition}
          />
        ))}
      </div>

      {/* BAR AKSI SIMPAN ROUND & VALIDASI SELISIH */}
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-emerald-500/30">
        {/* Info Selisih Skor Round Ini */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Total Selisih Round #{game.rounds.length + 1}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-xl font-black tabular-nums ${
                  roundSum === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-500'
                }`}
              >
                {roundSum > 0 ? `+${roundSum}` : roundSum}
              </span>
              {game.zeroSum && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    roundSum === 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {roundSum === 0 ? (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Zero-Sum Pas (0)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={12} />
                      <span>Harus 0</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          <span className="text-[11px] text-slate-400 hidden md:block">
            Tekan <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Enter</kbd> untuk simpan, <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Ctrl+Z</kbd> untuk Undo
          </span>
        </div>

        {/* Tombol Simpan Round */}
        <button
          type="button"
          onClick={handleSaveRound}
          disabled={isSaving || !isOnline || (game.zeroSum && roundSum !== 0)}
          className="btn-primary w-full sm:w-auto py-3.5 px-8 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={18} />
          <span>
            {isSaving
              ? 'Menyimpan...'
              : `Simpan Round #${game.rounds.length + 1}`}
          </span>
        </button>
      </div>

      {/* TABEL RIWAYAT ROUND */}
      <RoundHistoryTable
        players={game.players.map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
        }))}
        rounds={game.rounds}
        totals={playerTotalsMap}
        onEditRound={updateRound}
        onDeleteRound={deleteRound}
        isZeroSum={game.zeroSum}
      />

      {/* MODAL ATUR BATAS SKOR */}
      <ScoreLimitModal
        isOpen={isScoreLimitModalOpen}
        onClose={() => setIsScoreLimitModalOpen(false)}
        currentLimit={game.scoreLimit}
        currentAction={game.scoreLimitAction}
        highestPlayerScore={highestCurrentScore}
        onSave={updateGameSettings}
      />

      {/* DIALOG KONFIRMASI AKHIRI GAME */}
      <ConfirmDialog
        isOpen={isFinishConfirmOpen}
        onClose={() => setIsFinishConfirmOpen(false)}
        onConfirm={handleFinishGame}
        title="Akhiri Permainan Sekarang?"
        message={`Game akan diselesaikan dan skor akhir akan dikunci ke riwayat permainan.\n\nPemenang akan ditentukan dan podium akan ditampilkan.`}
        confirmText="Ya, Akhiri Game"
        cancelText="Lanjut Main"
      />

      {/* MODAL PODIUM PEMENANG & CONFETTI */}
      {winnerModalData && (
        <GameWinnerModal
          isOpen={isWinnerModalOpen}
          onClose={() => setIsWinnerModalOpen(false)}
          gameName={game.name}
          players={winnerModalData.scores}
          playerColors={playerColorsMap}
          playerPhotoVersions={playerPhotosMap}
          summaryText={winnerModalData.summaryText}
          onNewGame={() => {
            setIsWinnerModalOpen(false);
            router.push('/game/new');
          }}
        />
      )}
    </div>
  );
}
