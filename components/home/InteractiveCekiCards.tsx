'use client';

/**
 * Komponen Interaktif Kartu Ceki:
 * - Menampilkan 4 kartu Ceki bergaya tradisional yang tersusun rapi
 * - Interaksi Sentuh & Goyang (Tap & Wobble/Shuffle):
 *   - Animasi kocok kartu 3D yang lincah dengan Framer Motion
 *   - Efek suara kocok kartu berbasis Web Audio API (tanpa perlu file audio eksternal)
 *   - Getaran haptic di HP saat disentuh
 *   - Balon reaksi jenaka khas KOCOK KEKAR yang berganti-ganti
 *   - Penghitung berapa kali kartu sudah dikocok
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vibrate } from '@/lib/constants';
import { Sparkles, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CekiCardData {
  id: number;
  label: string;
  char: string;
  color: 'red' | 'black';
  badge: string;
  baseRotate: number;
  baseX: number;
  baseY: number;
}

const CARDS: CekiCardData[] = [
  { id: 1, label: 'Merah', char: '紅', color: 'red', badge: 'HONG', baseRotate: -18, baseX: -36, baseY: 12 },
  { id: 2, label: 'Putih', char: '白', color: 'black', badge: 'PEH', baseRotate: -6, baseX: -12, baseY: 2 },
  { id: 3, label: 'Titik', char: '點', color: 'red', badge: 'TIAM', baseRotate: 6, baseX: 12, baseY: 2 },
  { id: 4, label: 'Huat', char: '發', color: 'red', badge: 'HUAT', baseRotate: 18, baseX: 36, baseY: 12 },
];

const QUOTES = [
  'Kocok terooos bang! 🔥',
  'Awas kena slepet! 🃏',
  'Gua lagi aje ranger merahnyeee! 👑',
  'Hoki nih, ceki di tangan! 🎴',
  'Kocok Kekar, main barbar! 💪',
  'Kartu dewa turun! ✨',
  'Kena kunci lu pade! 🔒',
  'Satu round lagi gas! ⚡',
  'Duit goceng jadi ceban! 💰',
  'Kocokan sakti mandraguna! 🌪️',
];

export function InteractiveCekiCards() {
  const [isShuffling, setIsShuffling] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('Sentuh & Goyang Kartunya!');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Efek suara kocok kartu realistis menggunakan Web Audio API sintetis
  const playShuffleSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 4 flutter burst meniru gesekan kertas kartu
      for (let i = 0; i < 4; i++) {
        const time = ctx.currentTime + i * 0.045;
        const bufferSize = ctx.sampleRate * 0.035;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.3));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400 + i * 250, time);
        filter.Q.setValueAtTime(3.5, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.035);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(time);
      }
    } catch {
      // Abaikan jika browser memblokir audio
    }
  }, []);

  // Handler saat kartu disentuh / di-tap
  const handleShuffle = () => {
    vibrate([35, 30, 45, 25, 60]);
    playShuffleSound();

    setIsShuffling(true);
    setShakeCount((prev) => prev + 1);
    setShuffleSeed((prev) => prev + 1);

    // Pilih quote acak yang berbeda
    const nextQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setCurrentQuote(nextQuote);

    // Letupan confetti mini tipis di sekitar kartu
    try {
      confetti({
        particleCount: 16,
        spread: 60,
        origin: { y: 0.28 },
        colors: ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6'],
        disableForReducedMotion: true,
      });
    } catch {
      // fallback
    }

    setTimeout(() => {
      setIsShuffling(false);
    }, 450);
  };

  return (
    <div className="flex flex-col items-center select-none pt-2 pb-1">
      {/* Container Kartu Interaktif */}
      <motion.button
        type="button"
        onClick={handleShuffle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-56 h-36 flex items-center justify-center cursor-pointer group focus:outline-none"
        title="Ketuk atau sentuh untuk mengocok kartu Ceki!"
        aria-label="Kocok Kartu Ceki"
      >
        {/* Lingkaran Aura Cahaya Bersinar di Belakang Kartu */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/25 via-amber-400/25 to-rose-500/25 blur-2xl transition-opacity duration-300 ${
            isShuffling ? 'opacity-100 scale-125' : 'opacity-60 group-hover:opacity-90'
          }`}
        />

        {/* 4 Kartu Ceki Tradisional */}
        <div className="relative w-full h-full flex items-center justify-center">
          {CARDS.map((card, idx) => {
            // Dynamic jitter saat dikocok
            const shuffleRotation = isShuffling
              ? (Math.sin(shuffleSeed * 3 + idx) * 28)
              : card.baseRotate;
            const shuffleX = isShuffling
              ? card.baseX + (Math.cos(shuffleSeed * 4 + idx) * 22)
              : card.baseX;
            const shuffleY = isShuffling
              ? card.baseY - (Math.abs(Math.sin(shuffleSeed + idx)) * 18)
              : card.baseY;

            return (
              <motion.div
                key={card.id}
                animate={{
                  rotate: shuffleRotation,
                  x: shuffleX,
                  y: shuffleY,
                  scale: isShuffling ? [1, 1.12, 1] : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: isShuffling ? 450 : 250,
                  damping: isShuffling ? 12 : 20,
                }}
                style={{
                  zIndex: idx + 1,
                  transformOrigin: 'bottom center',
                }}
                className="absolute w-14 sm:w-16 h-24 sm:h-28 rounded-2xl p-1.5 flex flex-col justify-between shadow-lg shadow-black/20 border-2 transition-shadow duration-200 bg-gradient-to-b from-amber-50 via-white to-amber-100/90 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-amber-300/80 dark:border-amber-500/40 hover:border-emerald-400 group-hover:shadow-emerald-500/20"
              >
                {/* Header Kartu: Karakter Mini & Suit Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black ${
                      card.color === 'red' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {card.char}
                  </span>
                  <span className="text-[7px] font-black uppercase tracking-tighter px-1 py-0.2 rounded-full bg-amber-200/60 dark:bg-slate-700 text-amber-900 dark:text-amber-300">
                    {card.badge}
                  </span>
                </div>

                {/* Karakter Tradisional Utama di Tengah */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <span
                    className={`text-2xl sm:text-3xl font-black drop-shadow-sm select-none ${
                      card.color === 'red'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-850 dark:text-slate-100'
                    }`}
                    style={{ fontFamily: 'serif' }}
                  >
                    {card.char}
                  </span>
                  <div
                    className={`w-4 h-1 rounded-full mt-0.5 ${
                      card.color === 'red' ? 'bg-rose-500/40' : 'bg-slate-400/40'
                    }`}
                  />
                </div>

                {/* Footer Kartu (Simbol Terbalik) */}
                <div className="flex items-center justify-between rotate-180">
                  <span
                    className={`text-[10px] font-black ${
                      card.color === 'red' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {card.char}
                  </span>
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      card.color === 'red' ? 'bg-rose-500' : 'bg-slate-700 dark:bg-slate-300'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Petunjuk Interaksi Floating (Ikon Sentuh) */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute -bottom-1 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-md shadow-emerald-500/30 flex items-center gap-1 z-20 pointer-events-none"
        >
          <Sparkles size={11} className="animate-spin-slow" />
          <span>Tap Kocok!</span>
        </motion.div>
      </motion.button>

      {/* Balon Reaksi Lucu & Counter Kocok */}
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 py-1 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/50 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm"
          >
            <span>{currentQuote}</span>
          </motion.div>
        </AnimatePresence>

        {shakeCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[10px] font-bold text-slate-400 flex items-center gap-1"
          >
            <Flame size={12} className="text-orange-500" />
            <span>Kartu telah dikocok {shakeCount}x</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
