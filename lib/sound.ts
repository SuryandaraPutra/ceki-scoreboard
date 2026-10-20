/**
 * Audio Synthesis Utility menggunakan Web Audio API murni.
 * Tanpa perlu unduh file audio eksternal (.mp3/.wav), bekerja offline & tanpa latensi.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Mainkan Efek Suara Kemenangan Juara 1 (Triumphant Victory Fanfare + Sparkle Chimes)
 */
export function playVictorySound(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), now);
    masterGain.connect(ctx.destination);

    // Filter hangat untuk instrumen brass
    const brassFilter = ctx.createBiquadFilter();
    brassFilter.type = 'lowpass';
    brassFilter.frequency.setValueAtTime(2600, now);
    brassFilter.Q.setValueAtTime(1.8, now);
    brassFilter.connect(masterGain);

    // ─────────────────────────────────────────────
    // 1. FANFARE BRASS ARPEGGIO MELODI
    // ─────────────────────────────────────────────
    // G4 -> C5 -> E5 -> G5 -> GRAND FINALE CHORD (C5+E5+G5+C6)
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
      noteGain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
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
    const chordDur = 1.5;
    const chordFreqs = [261.63, 523.25, 659.25, 783.99, 1046.5]; // C4, C5, E5, G5, C6

    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      // Campuran gelombang sawtooth & triangle untuk ketebalan bunyi
      osc.type = idx === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, chordTime);

      const peakVolume = idx === 0 ? 0.35 : 0.22;
      noteGain.gain.setValueAtTime(0.001, chordTime);
      noteGain.gain.linearRampToValueAtTime(peakVolume, chordTime + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, chordTime + chordDur);

      osc.connect(noteGain);
      noteGain.connect(brassFilter);

      osc.start(chordTime);
      osc.stop(chordTime + chordDur + 0.1);
    });

    // Sub-bass thud saat akord utama berbunyi untuk hentakan emosional
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(95, chordTime);
    bassOsc.frequency.exponentialRampToValueAtTime(35, chordTime + 0.35);

    bassGain.gain.setValueAtTime(0.45, chordTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.4);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(chordTime);
    bassOsc.stop(chordTime + 0.45);

    // ─────────────────────────────────────────────
    // 3. SPARKLE CHIMES (Kilau Bintang Kemenangan)
    // ─────────────────────────────────────────────
    // Arpeggio nada tinggi bergulir di t = 0.9s
    const sparkleNotes = [
      { freq: 1318.51, delay: 0.90 }, // E6
      { freq: 1567.98, delay: 0.99 }, // G6
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
      sGain.gain.linearRampToValueAtTime(0.2, sTime + 0.015);
      sGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 0.55);

      sOsc.connect(sGain);
      sGain.connect(masterGain);

      sOsc.start(sTime);
      sOsc.stop(sTime + 0.6);
    });
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}
