'use client';

/**
 * Komponen Dialog Konfirmasi aksi berbahaya atau penting.
 */

import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  /** Jika diisi, pengguna harus mengetik teks ini agar tombol konfirmasi aktif */
  requireInput?: string;
  inputPlaceholder?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  isDanger = false,
  requireInput,
  inputPlaceholder = '',
}: ConfirmDialogProps) {
  const [typedInput, setTypedInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canConfirm = !requireInput || typedInput === requireInput;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      setIsSubmitting(true);
      await onConfirm();
      setTypedInput('');
      onClose();
    } catch {
      // Error ditangani pemanggil
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTypedInput('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center">
        {isDanger && (
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mb-3">
            <AlertTriangle size={24} />
          </div>
        )}

        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          {title}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 whitespace-pre-line">
          {message}
        </p>

        {requireInput && (
          <div className="w-full mb-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Ketik <span className="font-mono text-rose-500 font-bold">{requireInput}</span> untuk konfirmasi:
            </p>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={inputPlaceholder || requireInput}
              className="input-field text-center font-mono text-sm tracking-wider"
              autoFocus
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn-secondary py-2.5 text-xs font-semibold"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className={`${
              isDanger ? 'btn-danger' : 'btn-primary'
            } py-2.5 text-xs font-semibold`}
          >
            {isSubmitting ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
