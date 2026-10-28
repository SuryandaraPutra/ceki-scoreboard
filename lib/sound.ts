/**
 * Audio Synthesis Utility menggunakan Web Audio API murni.
 * Tanpa perlu file audio eksternal (.mp3/.wav), bekerja 100% offline & tanpa latensi.
 */

let sharedAudioCtx: AudioContext | null = null;
let audioUnlocked = false;

/**
 * Dapatkan atau buat AudioContext. Dibuat lazy (hanya setelah ada interaksi user)
 * untuk menghindari autoplay policy browser.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Buka kunci AudioContext. Dipanggil saat interaksi user.
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  audioUnlocked = true;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {}
}

// Pasang listener global otomatis — mendeteksi interaksi user pertama kali
// Tidak hapus listener setelah satu event agar setiap tipe interaksi ter-handle
if (typeof window !== 'undefined') {
  const onUserInteraction = () => {
    if (!audioUnlocked) {
      unlockAudio();
    }
  };
  window.addEventListener('pointerdown', onUserInteraction, { passive: true });
  window.addEventListener('touchstart', onUserInteraction, { passive: true });
  window.addEventListener('click', onUserInteraction, { passive: true });
  window.addEventListener('keydown', onUserInteraction, { passive: true });
}

function runVictoryNotes(ctx: AudioContext, volume = 0.85) {
  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), now);
    masterGain.connect(ctx.destination);

    // Filter hangat & dinamis untuk instrumen brass terompet
    const brassFilter = ctx.createBiquadFilter();
    brassFilter.type = 'lowpass';
    brassFilter.frequency.setValueAtTime(3200, now);
    brassFilter.frequency.exponentialRampToValueAtTime(2000, now + 1.2);
    brassFilter.Q.setValueAtTime(2.0, now);
    brassFilter.connect(masterGain);

    // ─────────────────────────────────────────────
    // 1. FANFARE BRASS ARPEGGIO MELODI JUARA
    // ─────────────────────────────────────────────
    // G4 -> C5 -> E5 -> G5 -> GRAND FINALE CHORD
    const melody = [
      { freq: 392.0, time: 0.0, dur: 0.13 },   // G4
      { freq: 523.25, time: 0.14, dur: 0.13 },  // C5
      { freq: 659.25, time: 0.28, dur: 0.13 },  // E5
      { freq: 783.99, time: 0.42, dur: 0.22 },  // G5
    ];

    melody.forEach(({ freq, time, dur }) => {
      const startTime = now + time;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.linearRampToValueAtTime(0.45, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);

      osc.connect(noteGain);
      noteGain.connect(brassFilter);

      osc.start(startTime);
      osc.stop(startTime + dur + 0.05);
    });

    // ─────────────────────────────────────────────
    // 2. GRAND FINALE CHORD (C Mayor Megah pada t = 0.65s)
    // ─────────────────────────────────────────────
    const chordTime = now + 0.65;
    const chordDur = 1.6;
    const chordFreqs = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4, G4, C5, E5, G5, C6

    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, chordTime);

      const peakVolume = idx === 0 ? 0.35 : 0.24;
      noteGain.gain.setValueAtTime(0.001, chordTime);
      noteGain.gain.linearRampToValueAtTime(peakVolume, chordTime + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, chordTime + chordDur);

      osc.connect(noteGain);
      noteGain.connect(brassFilter);

      osc.start(chordTime);
      osc.stop(chordTime + chordDur + 0.1);
    });

    // Sub-bass impact saat akord utama berbunyi
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(105, chordTime);
    bassOsc.frequency.exponentialRampToValueAtTime(32, chordTime + 0.38);

    bassGain.gain.setValueAtTime(0.5, chordTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.42);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(chordTime);
    bassOsc.stop(chordTime + 0.45);

    // ─────────────────────────────────────────────
    // 3. SPARKLE CHIMES (Denting Kilau Bintang)
    // ─────────────────────────────────────────────
    const sparkleNotes = [
      { freq: 1318.51, delay: 0.88 }, // E6
      { freq: 1567.98, delay: 0.98 }, // G6
      { freq: 2093.00, delay: 1.08 }, // C7
      { freq: 2637.02, delay: 1.18 }, // E7
      { freq: 3135.96, delay: 1.28 }, // G7
    ];

    sparkleNotes.forEach(({ freq, delay }) => {
      const sTime = now + delay;
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();

      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(freq, sTime);

      sGain.gain.setValueAtTime(0.001, sTime);
      sGain.gain.linearRampToValueAtTime(0.25, sTime + 0.015);
      sGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 0.6);

      sOsc.connect(sGain);
      sGain.connect(masterGain);

      sOsc.start(sTime);
      sOsc.stop(sTime + 0.65);
    });
  } catch (err) {
    console.warn('Gagal memainkan nada kemenangan:', err);
  }
}

/**
 * Mainkan Efek Suara Kemenangan Juara 1
 * Dengan retry mechanism untuk mengatasi AudioContext yang masih suspended.
 */
export function playVictorySound(volume = 0.85) {
  if (typeof window === 'undefined') return;

  const tryPlay = (attemptsLeft: number) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx
          .resume()
          .then(() => {
            // Tambahkan sedikit delay setelah resume agar AudioContext siap
            setTimeout(() => runVictoryNotes(ctx, volume), 80);
          })
          .catch(() => {
            // Retry jika masih gagal
            if (attemptsLeft > 0) {
              setTimeout(() => tryPlay(attemptsLeft - 1), 150);
            }
          });
        return;
      }

      runVictoryNotes(ctx, volume);
    } catch (e) {
      console.warn('Audio playback error:', e);
      if (attemptsLeft > 0) {
        setTimeout(() => tryPlay(attemptsLeft - 1), 150);
      }
    }
  };

  // Coba mainkan langsung, dengan fallback 3 retry @ 150ms
  tryPlay(3);
}

function runHangusNotes(ctx: AudioContext, volume = 0.8) {
  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), now);
    masterGain.connect(ctx.destination);

    // 1. Descending slide sound (slide from 420Hz down to 80Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.7);

    // 2. Heavy impact thud at the end (t = 0.45s)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(110, now + 0.45);
    thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.9);

    thudGain.gain.setValueAtTime(0.001, now + 0.45);
    thudGain.gain.linearRampToValueAtTime(0.5, now + 0.5);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    thudOsc.connect(thudGain);
    thudGain.connect(masterGain);
    thudOsc.start(now + 0.45);
    thudOsc.stop(now + 1.0);
  } catch (err) {
    console.warn('Gagal memainkan nada hangus:', err);
  }
}

/**
 * Mainkan Efek Suara Skor Hangus / Balap 100+ Menjadi 0
 */
export function playHangusSound(volume = 0.8) {
  if (typeof window === 'undefined') return;

  const tryPlay = (attemptsLeft: number) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx
          .resume()
          .then(() => {
            setTimeout(() => runHangusNotes(ctx, volume), 80);
          })
          .catch(() => {
            if (attemptsLeft > 0) {
              setTimeout(() => tryPlay(attemptsLeft - 1), 150);
            }
          });
        return;
      }

      runHangusNotes(ctx, volume);
    } catch (e) {
      console.warn('Audio playback error:', e);
      if (attemptsLeft > 0) {
        setTimeout(() => tryPlay(attemptsLeft - 1), 150);
      }
    }
  };

  tryPlay(3);
}

