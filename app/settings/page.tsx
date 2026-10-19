'use client';

/**
 * Halaman Pengaturan & Cadangan Data (/settings):
 * - Konfigurasi aturan default game (skor awal, batas skor, aturan menang, zero-sum, getar)
 * - Ekspor database lengkap ke JSON (termasuk foto pemain dalam Base64)
 * - Impor database JSON (mode ganti semua / gabungkan data)
 * - Reset seluruh database (wajib ketik "HAPUS SEMUA")
 * - Keluar / Logout PIN jika PIN aktif
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SCORE_LIMIT_PRESETS, QUICK_VALUE_PRESETS } from '@/lib/constants';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Vibrate,
  ShieldAlert,
  Moon,
  Sun,
  Laptop,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PinLockModal } from '@/components/ui/PinLockModal';
import { Lock } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { settings, isLoading, updateSettings } = useSettings();

  // Kunci Keamanan PIN (Wajib 6666)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    const savedPin = sessionStorage.getItem('ceki_settings_unlocked');
    if (savedPin === '6666') {
      setIsUnlocked(true);
    } else {
      setIsPinModalOpen(true);
    }
  }, []);

  // Form State
  const [defaultInitialScore, setDefaultInitialScore] = useState<number>(0);
  const [defaultWinCondition, setDefaultWinCondition] = useState<'highest' | 'lowest'>('highest');
  const [defaultScoreLimit, setDefaultScoreLimit] = useState<string>('250');
  const [defaultScoreLimitAction, setDefaultScoreLimitAction] = useState<'notify' | 'ask' | 'auto'>('ask');
  const [defaultZeroSum, setDefaultZeroSum] = useState<boolean>(false);
  const [vibration, setVibration] = useState<boolean>(true);
  const [roundScoreMin, setRoundScoreMin] = useState<number>(-9999);
  const [roundScoreMax, setRoundScoreMax] = useState<number>(9999);
  const [defaultQuickValues, setDefaultQuickValues] = useState<number[]>([5, 15, 25]);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync settings dari DB
  useEffect(() => {
    if (settings) {
      setDefaultInitialScore(settings.defaultInitialScore ?? 0);
      setDefaultWinCondition(settings.defaultWinCondition ?? 'highest');
      setDefaultScoreLimit(
        settings.defaultScoreLimit !== undefined && settings.defaultScoreLimit !== null
          ? String(settings.defaultScoreLimit)
          : '250'
      );
      setDefaultScoreLimitAction(settings.defaultScoreLimitAction ?? 'ask');
      setDefaultZeroSum(settings.defaultZeroSum ?? false);
      setVibration(settings.vibration ?? true);
      setRoundScoreMin(settings.roundScoreMin ?? -9999);
      setRoundScoreMax(settings.roundScoreMax ?? 9999);
      setDefaultQuickValues(
        settings.defaultQuickValues && settings.defaultQuickValues.length > 0
          ? settings.defaultQuickValues
          : [5, 15, 25]
      );
    }
  }, [settings]);

  // Simpan Pengaturan
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSettings({
        defaultInitialScore: Number(defaultInitialScore) || 0,
        defaultWinCondition,
        defaultScoreLimit: defaultScoreLimit === '' ? null : parseInt(defaultScoreLimit, 10),
        defaultScoreLimitAction,
        defaultZeroSum,
        vibration,
        roundScoreMin: Number(roundScoreMin),
        roundScoreMax: Number(roundScoreMax),
        defaultQuickValues,
        theme: (theme as any) || 'system',
      });
      toast.success('Pengaturan berhasil disimpan ke database');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  // Ekspor Database ke JSON
  const handleExport = () => {
    window.location.href = '/api/export';
  };

  // Impor JSON
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setIsImporting(true);
      const text = await file.text();
      const json = JSON.parse(text);

      const payload = {
        mode: importMode,
        data: json.data || json,
      };

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal mengimpor data');
      }

      toast.success(result.message || 'Data berhasil diimpor!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'File JSON tidak valid atau gagal diimpor');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset Semua Data
  const handleResetData = async () => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'HAPUS SEMUA' }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal mereset data');
      }

      toast.success('Seluruh data berhasil direset');
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mereset');
    }
  };

  // Logout PIN
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/pin', { method: 'DELETE' });
      toast.success('Berhasil keluar');
      router.push('/pin');
    } catch {
      toast.error('Gagal keluar');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 glass-card p-8 text-center flex flex-col items-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mb-4 shadow-xl shadow-rose-500/20">
          <Lock size={32} className="animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-rose-600 dark:text-rose-400">
          HEH MAO DIAPAIN SI!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-xs">
          Menu Pengaturan & Cadangan Data terkunci. Masukkan kode PIN untuk mengakses konfigurasi.
        </p>
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold flex items-center gap-2"
        >
          <Lock size={16} />
          <span>Buka Kunci Pengaturan (PIN)</span>
        </button>

        <PinLockModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={() => {
            setIsUnlocked(true);
            sessionStorage.setItem('ceki_settings_unlocked', '6666');
            setIsPinModalOpen(false);
          }}
          title="HEH MAO DIAPAIN SI!"
          description="Fitur pengaturan terkunci! Masukkan kode PIN untuk mengakses."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>Pengaturan & Cadangan</span>
          <Settings size={24} className="text-emerald-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Konfigurasi default permainan, backup database, dan migrasi Vercel
        </p>
      </div>

      {/* FORM PENGATURAN GLOBAL */}
      <form onSubmit={handleSaveSettings} className="glass-card p-5 sm:p-6 flex flex-col gap-5">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Aturan Default Permainan
        </h2>

        {/* Aturan Menang Default & Skor Awal Default */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Aturan Menang Default
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDefaultWinCondition('highest')}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  defaultWinCondition === 'highest'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Skor Tertinggi 🏆
              </button>
              <button
                type="button"
                onClick={() => setDefaultWinCondition('lowest')}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  defaultWinCondition === 'lowest'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Skor Terendah 🎯
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Skor Awal Default
            </label>
            <input
              type="number"
              value={defaultInitialScore}
              onChange={(e) => setDefaultInitialScore(parseInt(e.target.value, 10) || 0)}
              className="input-field text-sm font-bold"
            />
          </div>
        </div>

        {/* Batas Skor Default */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Batas Skor Default
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={() => setDefaultScoreLimit('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                defaultScoreLimit === ''
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              Tanpa Batas
            </button>
            {SCORE_LIMIT_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setDefaultScoreLimit(String(val))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  defaultScoreLimit === String(val)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          {defaultScoreLimit !== '' && (
            <div className="mt-2 max-w-xs">
              <span className="text-[11px] text-slate-400 block mb-1">Ketik Angka Batas Skor</span>
              <input
                type="number"
                value={defaultScoreLimit}
                onChange={(e) => setDefaultScoreLimit(e.target.value)}
                min={1}
                max={99999}
                className="input-field text-xs py-2"
              />
            </div>
          )}
        </div>

        {/* Preset Nilai Cepat Default */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Preset Nilai Cepat Default (Tombol +/- Cepat di Layar Skor)
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Pilih nilai preset default untuk tombol tambah/kurang cepat (mis. 5, 15, 25)
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_VALUE_PRESETS.map((val) => {
              const isSelected = defaultQuickValues.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setDefaultQuickValues((prev) => {
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
                  }}
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

        {/* Batasan Nilai per Round (Min / Max) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Batas Nilai Input Per Round
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Skor Minimal</span>
              <input
                type="number"
                value={roundScoreMin}
                onChange={(e) => setRoundScoreMin(parseInt(e.target.value, 10) || 0)}
                className="input-field text-xs py-2"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Skor Maksimal</span>
              <input
                type="number"
                value={roundScoreMax}
                onChange={(e) => setRoundScoreMax(parseInt(e.target.value, 10) || 0)}
                className="input-field text-xs py-2"
              />
            </div>
          </div>
        </div>

        {/* Sakelar Getar di HP */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Vibrate size={18} className="text-emerald-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Getar Haptic di HP
              </span>
              <span className="text-[11px] text-slate-400">
                Getar halus saat tombol plus / minus ditekan
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVibration(!vibration)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              vibration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                vibration ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Pilihan Tema */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Tema Tampilan
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Terang', icon: Sun },
              { id: 'dark', label: 'Gelap', icon: Moon },
              { id: 'system', label: 'Otomatis', icon: Laptop },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                    theme === t.id
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <Icon size={16} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tombol Simpan Pengaturan */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
          >
            <Save size={16} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* SEKSI CADANGAN DATA: EKSPOR & IMPOR */}
      <div className="glass-card p-5 sm:p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Cadangan & Migrasi Data (JSON)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ekspor data dari lokal untuk di-backup atau dipindahkan ke server Turso di Vercel
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Ekspor */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Ekspor Seluruh Data
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Unduh file JSON yang berisi semua pemain, foto (Base64), game, round, dan skor.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>Unduh File JSON</span>
            </button>
          </div>

          {/* Impor */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Impor Data JSON
              </span>
              <div className="flex items-center gap-3 my-1.5">
                <label className="text-[11px] flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-emerald-500"
                  />
                  <span>Ganti Semua</span>
                </label>
                <label className="text-[11px] flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-emerald-500"
                  />
                  <span>Gabungkan</span>
                </label>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              <span>{isImporting ? 'Mengimpor...' : 'Pilih File JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEKSI BAHAYA: RESET DATA & LOGOUT */}
      <div className="glass-card p-5 sm:p-6 border-rose-200 dark:border-rose-950 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <ShieldAlert size={18} />
            <span>Zona Berbahaya</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aksi di bawah ini tidak dapat dibatalkan
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Reset Seluruh Database
            </span>
            <span className="text-[11px] text-slate-400">
              Menghapus semua pemain, riwayat game, round, skor, dan mengembalikan settings ke bawaan
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="btn-danger py-2.5 px-5 text-xs font-bold shrink-0 self-stretch sm:self-auto"
          >
            Reset Semua Data
          </button>
        </div>

        {/* Tombol Logout PIN */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Kunci Sesi Aplikasi
            </span>
            <span className="text-[11px] text-slate-400">
              Keluar dan hapus cookie PIN jika proteksi PIN aktif
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut size={15} />
            <span>Keluar (Kunci)</span>
          </button>
        </div>
      </div>

      {/* Dialog Konfirmasi Reset dengan Kata Kunci */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="⚠️ Reset Seluruh Data"
        message="Tindakan ini akan menghapus SEMUA pemain, game, skor, dan foto profil. Data tidak dapat dikembalikan."
        confirmText="Hapus Seluruh Data"
        isDanger
        requireInput="HAPUS SEMUA"
        inputPlaceholder="Ketik HAPUS SEMUA"
      />
    </div>
  );
}
