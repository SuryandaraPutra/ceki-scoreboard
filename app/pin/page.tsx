'use client';

/**
 * Halaman Masukkan PIN (/pin):
 * Ditampilkan saat env APP_PIN diaktifkan dan pengguna belum memiliki cookie autentikasi.
 * Dilengkapi keypad angka touch-friendly di HP dan input keyboard di desktop.
 */

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Delete, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

function PinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('from') || '/';

  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (pin.length < 12) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      toast.error('Masukkan PIN Anda');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'PIN salah');
      }

      toast.success('PIN benar! Selamat datang.');
      router.push(returnUrl);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'PIN yang Anda masukkan salah');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xs mx-auto my-6 sm:my-12 p-6 sm:p-8 glass-card flex flex-col items-center text-center gap-5 animate-fade-in">
      {/* Icon Kunci */}
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Lock size={30} />
      </div>

      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Masukkan PIN
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Aplikasi dilindungi dengan kode akses PIN
        </p>
      </div>

      {/* Tampilan Titik/Bintang PIN */}
      <div className="flex items-center justify-center gap-3 my-2 h-10">
        {pin.length === 0 ? (
          <span className="text-xs text-slate-400 font-medium">
            Ketik PIN Anda...
          </span>
        ) : (
          pin.split('').map((_, i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pop shrink-0"
            />
          ))
        )}
      </div>

      {/* Input keyboard biasa (tersembunyi/opsional untuk desktop) */}
      <form onSubmit={handleSubmit} className="w-full">
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Ketik PIN..."
          className="input-field text-center font-mono tracking-widest text-lg mb-3"
          autoFocus
        />

        {/* Keypad Sentuh untuk HP */}
        <div className="grid grid-cols-3 gap-2 w-full mb-3 select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(num)}
              className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-850 text-slate-400 text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-850 text-slate-500 hover:text-rose-500 active:scale-95 flex items-center justify-center transition-all"
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !pin}
          className="btn-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2"
        >
          <span>{isSubmitting ? 'Memeriksa...' : 'Buka Aplikasi'}</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

export default function PinPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Memuat...</div>}>
      <PinContent />
    </Suspense>
  );
}
