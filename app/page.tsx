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
import { InteractiveCekiCards } from '@/components/home/InteractiveCekiCards';
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
  Tv,
} from 'lucide-react';
import { toast } from 'sonner';
import { TableScreenModal } from '@/components/game/TableScreenModal';
import { VictoryShareModal } from '@/components/game/VictoryShareModal';
import { unlockAudio, playHangusSound } from '@/lib/sound';
import { vibrate } from '@/lib/constants';

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
  const [isTableModeOpen, setIsTableModeOpen] = useState(false);
  const [isVictoryShareOpen, setIsVictoryShareOpen] = useState(false);
  const [finishedGameForVictory, setFinishedGameForVictory] = useState<any | null>(null);
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

  // Tampilkan Kartu Gambar Kemenangan Juara 1 dengan Sound Efek Kemenangan
  const triggerVictoryCelebration = useCallback(
    (activeGame: any, finalScores?: any[], finishedTimestamp?: number) => {
      if (!activeGame) return;

      // finalScores bisa berupa PlayerScore[] dari API (field: playerId, playerName, totalScore, rank)
      // atau updatedGameScores[] dari rounds API (field sama)
      const scoreMap = new Map<number, any>();
      if (finalScores && Array.isArray(finalScores)) {
        finalScores.forEach((s) => {
          // Support kedua format: s.playerId (dari API) atau s.id (dari state)
          const pid = s.playerId ?? s.id;
          if (pid != null) scoreMap.set(pid, s);
        });
      }

      const sortedPlayers = (activeGame.players || [])
        .map((p: any) => {
          const fs = scoreMap.get(p.id);
          const totalScore = fs?.totalScore ?? p.totalScore ?? 0;
          const rank = fs?.rank ?? p.rank ?? 999;
          // Ambil nama dari state (pasti ada), atau dari API (playerName)
          const name = p.name ?? fs?.playerName ?? 'Pemain';
          return {
            id: p.id,
            name,
            color: p.color,
            photoVersion: p.photoVersion,
            totalScore,
            rank,
            isWinner: rank === 1,
          };
        })
        .sort((a: any, b: any) => {
          if (a.rank && b.rank) return a.rank - b.rank;
          return b.totalScore - a.totalScore;
        });

      const gamePayload = {
        id: activeGame.id,
        name: activeGame.name,
        createdAt: activeGame.createdAt,
        finishedAt: finishedTimestamp || Math.floor(Date.now() / 1000),
        totalRounds: activeGame.rounds?.length || 0,
        rounds: activeGame.rounds || [],
        players: sortedPlayers,
      };

      setFinishedGameForVictory(gamePayload);
      setIsTableModeOpen(false);
      setIsFinishConfirmOpen(false);
      setIsVictoryShareOpen(true);
    },
    []
  );

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

    // Simpan snapshot game SEBELUM saveRound (yang akan memanggil mutate dan bisa menghapus state game)
    const gameSnapshot = game;

    try {
      setIsSaving(true);
      const res = await saveRound(currentRoundScores);

      // Reset input round
      const resetScores: Record<number, number> = {};
      for (const p of gameSnapshot.players) {
        resetScores[p.id] = 0;
      }
      setCurrentRoundScores(resetScores);

      if (res?.overtakeResets && res.overtakeResets.length > 0) {
        playHangusSound();
        vibrate([100, 80, 200, 80, 300]);
        const details = res.overtakeResets
          .map(
            (r: any) =>
              `${r.playerName} (${r.scoreBeforeReset} → 0) terbalap oleh ${r.overtakenByPlayerName} (${r.overtakerScore})`
          )
          .join(', ');
        toast.error(`💥 SKOR HANGUS JADI 0! ${details}`, { duration: 6000 });
      } else {
        toast.success(res?.message || 'Round berhasil disimpan!');
      }

      // Jika batas skor tercapai dan aksi adalah 'auto', game otomatis selesai
      if (res?.isAutoFinished) {
        toast.success('Batas skor tertinggi tercapai! Permainan selesai.');
        // Gunakan gameSnapshot karena game state mungkin sudah null setelah mutate()
        triggerVictoryCelebration(gameSnapshot, res?.updatedGameScores);
        return;
      }

      // Jika batas skor tercapai dan aksinya 'ask', tanyakan ke pengguna
      if (res?.hasReachedScoreLimit && gameSnapshot.scoreLimitAction === 'ask') {
        setTimeout(() => {
          setIsFinishConfirmOpen(true);
        }, 400);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan round');
    } finally {
      setIsSaving(false);
    }
  }, [game, isOnline, roundSum, currentRoundScores, saveRound, triggerVictoryCelebration]);

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

  // Akhiri Game & Tampilkan Gambar Siap Bagikan + Efek Suara Kemenangan
  const handleFinishGame = async () => {
    if (!game) return;
    try {
      // Simpan snapshot SEBELUM finishGame() yang akan memanggil mutate() dan menghapus state game
      const currentGameSnapshot = game;

      // finishGame() hook sudah mengembalikan result.data langsung (sudah di-unwrap)
      // Struktur: { gameId, gameName, finishedAt, scores: PlayerScore[], winners, summaryText }
      const res = await finishGame();

      if (res) {
        setWinnerModalData({
          scores: res.scores,
          summaryText: res.summaryText,
        });
        // Tampilkan gambar siap dibagikan ke layar dengan sound efek kemenangan & juara 1
        triggerVictoryCelebration(
          currentGameSnapshot,
          res.scores,
          res.finishedAt
        );
      } else {
        // Fallback: tampilkan dengan data dari snapshot meski tanpa skor final dari API
        triggerVictoryCelebration(currentGameSnapshot);
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
      <>
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-6 py-8 sm:py-16 animate-fade-in">
          {/* Kartu Ceki Interaktif (Sentuh & Goyang) */}
          <InteractiveCekiCards />

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white dark:text-slate-100 tracking-tight drop-shadow-md">
              KOCOK KEKAR
            </h1>
            <p className="text-sm sm:text-base text-slate-200 dark:text-slate-300 mt-2 max-w-lg mx-auto font-medium italic drop-shadow-sm">
              &ldquo;Hidup itu kayak Ceki: kartu bagus belum tentu menang, kartu jelek belum tentu kalah, yang pasti tetangga sebelah selalu curang.&rdquo;
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
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pemain
              </span>
            </Link>
            <Link
              href="/leaderboard"
              className="glass-card p-4 flex flex-col items-center gap-1.5 hover:border-amber-500 transition-colors"
            >
              <Trophy size={22} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Leaderboard
              </span>
            </Link>
            <Link
              href="/history"
              className="glass-card p-4 flex flex-col items-center gap-1.5 hover:border-sky-500 transition-colors"
            >
              <History size={22} className="text-sky-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Riwayat
              </span>
            </Link>
          </div>
        </div>

        {/* Modal Gambar Kemenangan Siap Bagikan (Tetap tampil setelah game diselesaikan) */}
        <VictoryShareModal
          isOpen={isVictoryShareOpen}
          onClose={() => {
            setIsVictoryShareOpen(false);
            setFinishedGameForVictory(null);
          }}
          game={finishedGameForVictory}
          onNewGame={() => {
            setIsVictoryShareOpen(false);
            setFinishedGameForVictory(null);
            router.push('/game/new');
          }}
        />
      </>
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
            onClick={() => setIsTableModeOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/25 active:scale-95"
            title="Buka Mode Layar Meja (Tengah Meja / TV)"
          >
            <Tv size={14} />
            <span>Layar Meja</span>
          </button>

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
        roundResets={game.roundResets}
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
        title={game?.hasReachedScoreLimit ? '🏁 Batas Skor Tertinggi Tercapai!' : 'Akhiri Permainan Sekarang?'}
        message={
          game?.hasReachedScoreLimit
            ? `Pemain telah mencapai atau melebihi batas skor target (${game.scoreLimit}).\n\nAkhiri permainan sekarang untuk menampilkan gambar kemenangan juara 1 & sound efek kemenangan?`
            : `Game akan diselesaikan dan skor akhir akan dikunci ke riwayat permainan.\n\nPemenang akan ditentukan dan kartu gambar kemenangan siap dibagikan akan ditampilkan.`
        }
        confirmText="Ya, Akhiri Game & Lihat Juara"
        cancelText="Lanjut Main"
      />

      {/* MODAL PODIUM PEMENANG & CONFETTI */}
      {winnerModalData && (
        <GameWinnerModal
          isOpen={isWinnerModalOpen}
          onClose={() => setIsWinnerModalOpen(false)}
          gameName={game?.name || finishedGameForVictory?.name}
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

      {/* MODAL GAMBAR KEMENANGAN SIAP BAGIKAN (DENGAN SOUND EFEK & JUARA 1) */}
      <VictoryShareModal
        isOpen={isVictoryShareOpen}
        onClose={() => {
          setIsVictoryShareOpen(false);
          setFinishedGameForVictory(null);
        }}
        game={finishedGameForVictory}
        onNewGame={() => {
          setIsVictoryShareOpen(false);
          setFinishedGameForVictory(null);
          router.push('/game/new');
        }}
      />

      {/* MODAL MODE LAYAR MEJA & TV */}
      <TableScreenModal
        isOpen={isTableModeOpen}
        onClose={() => setIsTableModeOpen(false)}
        game={game}
        currentRoundScores={currentRoundScores}
        onScoreChange={handleScoreChange}
        onSaveRound={handleSaveRound}
        onUndo={handleUndo}
        isSaving={isSaving}
      />
    </div>
  );
}
