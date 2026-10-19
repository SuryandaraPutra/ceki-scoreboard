'use client';

/**
 * Halaman Buat Game Baru (/game/new):
 * - Memilih tepat 4 pemain (atau tambah pemain baru langsung dari layar ini)
 * - Pengaturan: Nama game, aturan menang, skor awal, batas skor tertinggi & aksi,
 *   mode zero-sum, preset nilai cepat, target round
 * - Konfirmasi jika masih ada game aktif
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayers } from '@/hooks/usePlayers';
import { useActiveGame } from '@/hooks/useActiveGame';
import { useSettings } from '@/hooks/useSettings';
import { Avatar } from '@/components/ui/Avatar';
import { PlayerModal } from '@/components/player/PlayerModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PinLockModal } from '@/components/ui/PinLockModal';
import { SCORE_LIMIT_PRESETS, QUICK_VALUE_PRESETS } from '@/lib/constants';
import { Plus, Check, Play, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewGamePage() {
  const router = useRouter();
  const { activePlayers, createPlayer, isLoading: isPlayersLoading } = usePlayers();
  const { game: activeGame, finishGame } = useActiveGame();
  const { settings } = useSettings();

  // Form State
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [gameName, setGameName] = useState('');
  const [initialScore, setInitialScore] = useState<number>(settings?.defaultInitialScore ?? 0);
  const [winCondition, setWinCondition] = useState<'highest' | 'lowest'>(
    settings?.defaultWinCondition ?? 'highest'
  );
  const [scoreLimit, setScoreLimit] = useState<string>(
    settings?.defaultScoreLimit !== undefined && settings?.defaultScoreLimit !== null
      ? String(settings.defaultScoreLimit)
      : '250'
  );
  const [scoreLimitAction, setScoreLimitAction] = useState<'notify' | 'ask' | 'auto'>(
    settings?.defaultScoreLimitAction ?? 'ask'
  );
  const [zeroSum, setZeroSum] = useState<boolean>(settings?.defaultZeroSum ?? false);
  const [quickValues, setQuickValues] = useState<number[]>(
    settings?.defaultQuickValues && settings.defaultQuickValues.length > 0
      ? settings.defaultQuickValues
      : [5, 15, 25]
  );
  const [targetRounds, setTargetRounds] = useState<string>('');

  // Sinkronisasi state saat settings dimuat
  React.useEffect(() => {
    if (settings) {
      if (settings.defaultScoreLimit !== undefined && settings.defaultScoreLimit !== null) {
        setScoreLimit(String(settings.defaultScoreLimit));
      } else {
        setScoreLimit('250');
      }
      if (
        settings.defaultQuickValues &&
        Array.isArray(settings.defaultQuickValues) &&
        settings.defaultQuickValues.length > 0
      ) {
        setQuickValues(settings.defaultQuickValues);
      }
      if (settings.defaultInitialScore !== undefined) {
        setInitialScore(settings.defaultInitialScore);
      }
      if (settings.defaultWinCondition) {
        setWinCondition(settings.defaultWinCondition);
      }
      if (settings.defaultScoreLimitAction) {
        setScoreLimitAction(settings.defaultScoreLimitAction);
      }
      if (settings.defaultZeroSum !== undefined) {
        setZeroSum(settings.defaultZeroSum);
      }
    }
  }, [settings]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [activeGameConflict, setActiveGameConflict] = useState(false);

  // Toggle seleksi pemain (maksimal 4)
  const togglePlayerSelect = (playerId: number) => {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.length >= 4) {
        toast.warning('Tepat 4 pemain yang dapat dipilih');
        return prev;
      }
      return [...prev, playerId];
    });
  };

  // Toggle quick value preset
  const toggleQuickValue = (val: number) => {
    setQuickValues((prev) => {
      if (prev.includes(val)) {
        if (prev.length <= 1) {
          toast.warning('Minimal 1 nilai preset cepat');
          return prev;
        }
        return prev.filter((v) => v !== val);
      }
      if (prev.length >= 8) {
        toast.warning('Maksimal 8 preset nilai cepat');
        return prev;
      }
      return [...prev, val].sort((a, b) => a - b);
    });
  };

  const handleCreateGame = async (discardActive: boolean = false) => {
    if (selectedPlayerIds.length !== 4) {
      toast.error('Harus memilih tepat 4 pemain');
      return;
    }

    if (activeGame && !discardActive) {
      setActiveGameConflict(true);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: gameName.trim() || undefined,
        playerIds: selectedPlayerIds,
        initialScore: Number(initialScore) || 0,
        winCondition,
        scoreLimit: scoreLimit === '' ? null : parseInt(scoreLimit, 10),
        scoreLimitAction,
        zeroSum,
        quickValues,
        targetRounds: targetRounds === '' ? null : parseInt(targetRounds, 10),
        discardActive,
      };

      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal membuat game baru');
      }

      toast.success('Game baru berhasil dimulai!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      {/* Tombol Kembali & Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Mulai Game Baru
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pilih 4 pemain dan atur parameter permainan kartu Ceki
          </p>
        </div>
      </div>

      {/* Peringatan jika masih ada game aktif */}
      {activeGame && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-sm block">Masih Ada Game Berjalan!</span>
            <span>
              Game #{activeGame.id} {activeGame.name ? `("${activeGame.name}")` : ''} sedang aktif.
              Memulai game baru akan meminta Anda mengakhiri atau membuang game tersebut.
            </span>
            <div className="mt-2 flex gap-2">
              <Link href="/" className="font-extrabold underline text-emerald-600 dark:text-emerald-400">
                Kembali & Lanjutkan Game
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SEKSI 1: PILIH 4 PEMAIN */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Pilih Tepat 4 Pemain</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  selectedPlayerIds.length === 4
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {selectedPlayerIds.length}/4 Dipilih
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Urutan pemilihan menentukan urutan kursi 1 sampai 4
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPinModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
          >
            <Plus size={14} />
            <span>Pemain Baru</span>
          </button>
        </div>

        {/* Daftar Pemain Tersedia */}
        {isPlayersLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl skeleton" />
            ))}
          </div>
        ) : activePlayers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 mb-3">
              Belum ada pemain yang terdaftar. Tambahkan 4 pemain terlebih dahulu.
            </p>
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-bold"
            >
              Tambah Pemain Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {activePlayers.map((p) => {
              const seatIndex = selectedPlayerIds.indexOf(p.id);
              const isSelected = seatIndex !== -1;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlayerSelect(p.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all relative group select-none ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-sm'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40'
                  }`}
                >
                  {/* Badge Urutan Kursi */}
                  {isSelected && (
                    <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                      {seatIndex + 1}
                    </span>
                  )}

                  <Avatar
                    id={p.id}
                    name={p.name}
                    color={p.color}
                    photoVersion={p.photoVersion}
                    size="md"
                    className="mb-2"
                  />

                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate w-full">
                    {p.name}
                  </span>

                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {isSelected ? `Kursi ${seatIndex + 1}` : 'Ketuk untuk pilih'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SEKSI 2: PENGATURAN GAME */}
      <div className="glass-card p-5 sm:p-6 flex flex-col gap-5">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Aturan & Opsi Game
        </h2>

        {/* Nama Game (Opsional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Nama Game (Opsional)
          </label>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Contoh: Malam Minggu Round 1, Turnamen Ceki..."
            maxLength={50}
            className="input-field text-sm"
          />
        </div>

        {/* Grid Aturan Menang & Skor Awal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Aturan Menang */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Aturan Pemenang
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWinCondition('highest')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  winCondition === 'highest'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Skor Tertinggi 🏆
              </button>
              <button
                type="button"
                onClick={() => setWinCondition('lowest')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  winCondition === 'lowest'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Skor Terendah 🎯
              </button>
            </div>
          </div>

          {/* Skor Awal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Skor Awal Tiap Pemain
            </label>
            <input
              type="number"
              value={initialScore}
              onChange={(e) => setInitialScore(parseInt(e.target.value, 10) || 0)}
              className="input-field text-sm font-bold"
            />
          </div>
        </div>

        {/* Batas Skor Tertinggi & Aksi */}
        <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-850/60 border border-slate-200/50 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Batas Skor Tertinggi
              </span>
              <span className="text-[11px] text-slate-400">
                Pemain mencapai batas memicu aksi game selesai
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScoreLimit('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scoreLimit === ''
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tanpa Batas
            </button>
            {SCORE_LIMIT_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setScoreLimit(String(val))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scoreLimit === String(val)
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {scoreLimit !== '' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Ketik Angka Batas
                </label>
                <input
                  type="number"
                  value={scoreLimit}
                  onChange={(e) => setScoreLimit(e.target.value)}
                  min={1}
                  max={99999}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Aksi Saat Batas Tercapai
                </label>
                <select
                  value={scoreLimitAction}
                  onChange={(e) => setScoreLimitAction(e.target.value as any)}
                  className="input-field text-xs py-2"
                >
                  <option value="ask">Tanya apakah game diakhiri (Default)</option>
                  <option value="notify">Hanya beri tahu (lanjutkan)</option>
                  <option value="auto">Akhiri otomatis</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mode Zero-Sum Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200/50 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Mode Zero-Sum (Total Skor Round = 0)
            </span>
            <span className="text-[11px] text-slate-400">
              Round hanya bisa disimpan bila total selisih 4 pemain tepat 0
            </span>
          </div>
          <button
            type="button"
            onClick={() => setZeroSum(!zeroSum)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              zeroSum ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                zeroSum ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Preset Nilai Cepat */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Pilih Preset Nilai Cepat (Tombol +/- Cepat di Layar Skor)
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_VALUE_PRESETS.map((val) => {
              const isSelected = quickValues.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => toggleQuickValue(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tombol Mulai Game */}
      <button
        type="button"
        onClick={() => handleCreateGame(false)}
        disabled={isSubmitting || selectedPlayerIds.length !== 4}
        className="btn-primary py-4 text-base font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
      >
        <Play size={20} fill="currentColor" />
        <span>
          {selectedPlayerIds.length === 4
            ? 'Mulai Game Sekarang'
            : `Pilih ${4 - selectedPlayerIds.length} Pemain Lagi`}
        </span>
      </button>

      {/* Modal Tambah Pemain Cepat */}
      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSave={async (data) => {
          const created = await createPlayer(data.name, data.color);
          if (selectedPlayerIds.length < 4) {
            setSelectedPlayerIds((prev) => [...prev, created.id]);
          }
        }}
      />

      {/* Dialog Konflik Game Aktif */}
      <ConfirmDialog
        isOpen={activeGameConflict}
        onClose={() => setActiveGameConflict(false)}
        onConfirm={async () => {
          await handleCreateGame(true); // Buang game aktif lama
        }}
        title="Masih Ada Game Aktif"
        message={`Game #${activeGame?.id} masih sedang berjalan.\n\nApakah Anda ingin membuang/mengakhiri game lama tersebut dan memulai game baru ini?`}
        confirmText="Buang Game Lama & Mulai Baru"
        cancelText="Batal"
        isDanger
      />

      {/* Modal Kunci Keamanan PIN Tambah Pemain */}
      <PinLockModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setIsPlayerModalOpen(true);
        }}
        title="HEH MAO DIAPAIN SI!"
        description="Fitur tambah pemain terkunci! Masukkan kode PIN untuk melanjutkan."
      />
    </div>
  );
}
