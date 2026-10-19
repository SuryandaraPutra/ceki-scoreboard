'use client';

/**
 * Komponen Modal Dialog Reusable dengan animasi dan backdrop blur.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Kunci scroll body saat modal terbuka agar background dashboard tetap rapi
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-3.5 sm:p-6 pb-16 overflow-y-auto"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Card - Meluncur dari atas ke bawah seperti notifikasi pesan masuk */}
          <motion.div
            initial={{ opacity: 0, y: -48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -48, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={`relative w-full ${maxWidthMap[maxWidth]} bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-slate-950/25 p-5 sm:p-6 z-10 max-h-[85vh] overflow-y-auto`}
          >
            {/* Pill handle khas notifikasi ponsel */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3.5" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                {title && (
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
                aria-label="Tutup modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
