'use client';

/**
 * Komponen Interaktif Kartu Remi (Playing Cards):
 * - Menampilkan 4 kartu remi (As Sekop ♠, King Hati ♥, Queen Wajik ♦, Jack Keriting ♣)
 * - Responsif sempurna di HP dan desktop (aspek rasio kartu remi 2.5:3.5, tidak mengecil atau pipih)
 * - Interaksi Sentuh & Goyang (Tap & Shuffle):
 *   - Animasi kocok kartu 3D yang lincah dengan Framer Motion
 *   - Efek suara desiran kartu (card flutter/shuffle) berbasis Web Audio API
 *   - Getaran haptic di HP saat disentuh
 *   - Balon reaksi jenaka seputar ceki & kartu remi
 *   - Penghitung berapa kali kartu sudah dikocok
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vibrate } from '@/lib/constants';
import { Sparkles, Flame, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayingCardData {
  id: number;
  rank: string;
  suit: 'spade' | 'heart' | 'diamond' | 'club';
  suitSymbol: string;
  color: 'red' | 'black';
  name: string;
  baseRotate: number;
  baseX: number;
  baseY: number;
}

const CARDS: PlayingCardData[] = [
  { id: 1, rank: 'A', suit: 'spade',   suitSymbol: '♠', color: 'black', name: 'As Sekop',      baseRotate: -18, baseX: -44, baseY: 8 },
  { id: 2, rank: 'K', suit: 'heart',   suitSymbol: '♥', color: 'red',   name: 'King Hati',     baseRotate: -6,  baseX: -15, baseY: 0 },
  { id: 3, rank: 'Q', suit: 'diamond', suitSymbol: '♦', color: 'red',   name: 'Queen Wajik',   baseRotate: 6,   baseX: 15,  baseY: 0 },
  { id: 4, rank: 'J', suit: 'club',    suitSymbol: '♣', color: 'black', name: 'Jack Keriting', baseRotate: 18,  baseX: 44,  baseY: 8 },
];

const QUOTES = [
  'As Sekop di tangan, muka tetap santai! ♠️',
  'King Hati keluar, auto menang tipis! ♥️',
  'Awas wajiknya nyelip di lengan baju! ♦️',
  'Jack Keriting sakti mandraguna! ♣️',
  'Kocok terooos, jangan kasih kendor! 🔥',
  'Tetangga sebelah mulai lirik-lirik... 👀',
  'Kartu dewa siap turun ke meja! ✨',
  'Kocok Kekar, main barbar! 💪',
  'Satu round lagi gaspol! ⚡',
  'Jangan sampai salah buang kartu! 🃏',
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

      // 4 flutter burst meniru gesekan kertas kartu remi
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

    // Ganti quote acak
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
      {/* Container Kartu Remi Interaktif — Ukuran pas dan tidak mengecil di HP */}
      <motion.button
        type="button"
        onClick={handleShuffle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-64 sm:w-72 h-36 sm:h-40 flex items-center justify-center cursor-pointer group focus:outline-none"
        title="Ketuk atau sentuh untuk mengocok kartu remi!"
        aria-label="Kocok Kartu Remi"
      >
        {/* Lingkaran Aura Cahaya Bersinar di Belakang Kartu */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/25 via-amber-400/25 to-rose-500/25 blur-2xl transition-opacity duration-300 ${
            isShuffling ? 'opacity-100 scale-125' : 'opacity-60 group-hover:opacity-90'
          }`}
        />

        {/* 4 Kartu Remi Tersusun Fanned Out */}
        <div className="relative w-full h-full flex items-center justify-center">
          {CARDS.map((card, idx) => {
            // Dynamic jitter saat dikocok
            const shuffleRotation = isShuffling
              ? (Math.sin(shuffleSeed * 3 + idx) * 26)
              : card.baseRotate;
            const shuffleX = isShuffling
              ? card.baseX + (Math.cos(shuffleSeed * 4 + idx) * 20)
              : card.baseX;
            const shuffleY = isShuffling
              ? card.baseY - (Math.abs(Math.sin(shuffleSeed + idx)) * 16)
              : card.baseY;

            const isRed = card.color === 'red';
            const colorClass = isRed
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-900 dark:text-slate-100';

            return (
              <motion.div
                key={card.id}
                animate={{
                  rotate: shuffleRotation,
                  x: shuffleX,
                  y: shuffleY,
                  scale: isShuffling ? [1, 1.1, 1] : 1,
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
                // Dimensi pasti: 82px x 116px di mobile (rasio remi 0.706), 94px x 134px di sm+
                className="absolute w-[82px] sm:w-[94px] h-[116px] sm:h-[134px] shrink-0 rounded-xl p-2 flex flex-col justify-between shadow-lg shadow-black/20 border transition-all duration-200 bg-white dark:bg-slate-900 border-slate-300/80 dark:border-slate-700/80 hover:border-emerald-400 group-hover:shadow-emerald-500/25 ring-1 ring-black/5"
              >
                {/* Garis batas dalam kartu remi klasik */}
                <div className="absolute inset-1 rounded-lg border border-slate-200/60 dark:border-slate-800/80 pointer-events-none" />

                {/* Indeks Pojok Kiri Atas: Angka/Huruf + Lambang Remi */}
                <div className="relative z-10 flex flex-col items-center self-start leading-none pl-0.5 pt-0.5">
                  <span className={`text-xs sm:text-sm font-black tracking-tight ${colorClass}`}>
                    {card.rank}
                  </span>
                  <span className={`text-[12px] sm:text-[13px] leading-tight ${colorClass}`}>
                    {card.suitSymbol}
                  </span>
                </div>

                {/* Bagian Tengah Kartu: Desain Visual Khas Remi */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                  {card.rank === 'A' ? (
                    // As Sekop: Lambang Sekop Besar Elegan
                    <div className="relative flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl select-none text-slate-900 dark:text-slate-100 drop-shadow-sm font-serif leading-none">
                        ♠
                      </span>
                    </div>
                  ) : card.rank === 'K' ? (
                    // King Hati: Mahkota Mini + Simbol Hati
                    <div className="flex flex-col items-center -space-y-0.5">
                      <Crown size={14} className="text-amber-500 fill-amber-400 drop-shadow-xs" />
                      <span className="text-2xl sm:text-3xl select-none text-rose-600 dark:text-rose-400 drop-shadow-sm leading-none">
                        ♥
                      </span>
                    </div>
                  ) : card.rank === 'Q' ? (
                    // Queen Wajik: Mahkota Tiara + Simbol Wajik
                    <div className="flex flex-col items-center -space-y-0.5">
                      <Crown size={12} className="text-amber-400 fill-amber-300/60 drop-shadow-xs" />
                      <span className="text-2xl sm:text-3xl select-none text-rose-600 dark:text-rose-400 drop-shadow-sm leading-none">
                        ♦
                      </span>
                    </div>
                  ) : (
                    // Jack Keriting: Lambang Keriting Cantik
                    <div className="flex flex-col items-center">
                      <span className="text-2xl sm:text-3xl select-none text-slate-900 dark:text-slate-100 drop-shadow-sm leading-none">
                        ♣
                      </span>
                    </div>
                  )}
                </div>

                {/* Indeks Pojok Kanan Bawah: Angka/Huruf + Lambang (Rotated 180°) */}
                <div className="relative z-10 flex flex-col items-center self-end leading-none pl-0.5 pt-0.5 rotate-180">
                  <span className={`text-xs sm:text-sm font-black tracking-tight ${colorClass}`}>
                    {card.rank}
                  </span>
                  <span className={`text-[12px] sm:text-[13px] leading-tight ${colorClass}`}>
                    {card.suitSymbol}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Petunjuk Interaksi Floating (Ikon Sentuh) */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute -bottom-1 -right-2 sm:right-0 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-md shadow-emerald-500/30 flex items-center gap-1 z-20 pointer-events-none"
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
