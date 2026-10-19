'use client';

/**
 * Modal Kunci Keamanan PIN Khusus:
 * - Menampilkan pop-up "HEH MAO DIAPAIN SI!"
 * - Hanya menerima kode PIN: 6666 (selain itu tolak)
 * - Tampilan 4 kotak digit PIN interaktif + keypad numerik sentuh
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, Delete } from 'lucide-react';
import { toast } from 'sonner';

interface PinLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

const REQUIRED_PIN = '6666';

export function PinLockModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'HEH MAO DIAPAIN SI!',
  description = 'Fitur ini terkunci. Masukkan kode PIN untuk melanjutkan.',
}: PinLockModalProps) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setIsError(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Validasi PIN saat 4 digit terisi
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === REQUIRED_PIN) {
        toast.success('Akses dibuka!');
        setIsError(false);
        setErrorMessage('');
        setPin('');
        onSuccess();
      } else {
        setIsError(true);
        setErrorMessage('PIN salah! Akses ditolak.');
        toast.error('PIN salah! Akses ditolak.');
        // Beri jeda sejenak lalu kosongkan input
        const timer = setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, onSuccess]);

  // Listener keyboard fisik
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setPin((prev) => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setIsError(false);
        setErrorMessage('');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setIsError(false);
      setErrorMessage('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setIsError(false);
    setErrorMessage('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center -mt-1">
        {/* Ikon Gembok Berkedip */}
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mb-3 shadow-lg shadow-rose-500/20">
          <Lock size={28} className="animate-pulse" />
        </div>

        {/* Judul Khas Permintaan Pengguna */}
        <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px]">
          {description}
        </p>

        {/* 4 Kotak Digit PIN dengan Animasi Shake jika Salah */}
        <motion.div
          animate={isError ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-3 my-5"
        >
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = pin.length > index;
            return (
              <div
                key={index}
                className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                  isError
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-600'
                    : hasDigit
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 scale-105 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {hasDigit ? '●' : ''}
              </div>
            );
          })}
        </motion.div>

        {/* Pesan Error */}
        {errorMessage ? (
          <p className="text-xs font-bold text-rose-500 -mt-2 mb-3 flex items-center gap-1">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 -mt-2 mb-3">
            Ketik 4 digit kode PIN rahasia
          </p>
        )}

        {/* Keypad Numerik On-Screen (Khusus Mobile & Desktop) */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[260px] mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-lg active:scale-95 transition-all shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 font-bold text-xs active:scale-95 transition-all"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-lg active:scale-95 transition-all shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 font-bold text-lg active:scale-95 transition-all flex items-center justify-center"
            aria-label="Hapus satu angka"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Tombol Batal */}
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
        >
          Batal
        </button>
      </div>
    </Modal>
  );
}
