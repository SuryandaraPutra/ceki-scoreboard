'use client';

/**
 * Modal Berbagi Gambar Kemenangan Juara 1 (Format Potret PNG):
 * - Menghasilkan gambar vertikal resolusi tinggi:
 *   - 9:16 -> 1080 x 1920 px (Format pas untuk WhatsApp Status, Instagram Story, Reels, TikTok)
 *   - 3:4  -> 900 x 1200 px (Format potret klasik / feed foto)
 * - Tampilan kemenangan Juara 1 dengan kutipan: "GUA LAGI AJE RANGER MERAHNYEEEE"
 * - Klasemen vertikal 4 pemain yang elegan
 * - Tombol "Simpan ke Album Foto (Download PNG)" & "Bagikan Gambar (Web Share API)"
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '@/lib/constants';
import { getInitials } from '@/lib/calc';
import { playVictorySound } from '@/lib/sound';
import {
  Download,
  Share2,
  Check,
  Image as ImageIcon,
  Volume2,
  Play,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlayerInfo {
  id: number;
  name: string;
  color: string;
  photoVersion?: number;
  totalScore: number;
  rank?: number;
  isWinner?: boolean;
}

interface GameData {
  id: number;
  name: string | null;
  createdAt: number;
  finishedAt: number | null;
  totalRounds?: number;
  rounds?: any[];
  players: PlayerInfo[];
}

interface VictoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameData | null;
  onNewGame?: () => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error('Timeout loading photo'));
    }, 1500);
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Gagal memuat gambar'));
    };
    img.src = src;
  });
}

export function VictoryShareModal({
  isOpen,
  onClose,
  game,
  onNewGame,
}: VictoryShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Default format: 9:16 (Potret Story / Status)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '3:4'>('9:16');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ambil data pemain terurut & Juara 1
  const sortedPlayers = useMemo(() => {
    if (!game?.players || game.players.length === 0) return [];
    return [...game.players].sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      return b.totalScore - a.totalScore;
    });
  }, [game]);

  const winner = sortedPlayers[0] || (game?.players && game.players[0]);

  // Efek Suara Kemenangan & Ledakan Confetti otomatis saat modal dibuka
  useEffect(() => {
    if (isOpen && game) {
      // Mainkan efek suara kemenangan dengan sedikit delay agar browser sempat
      // memproses interaksi user yang membuka modal ini (klik tombol akhiri game)
      const soundTimer = setTimeout(() => {
        playVictorySound();
      }, 300);
      // Mainkan lagi setelah 500ms untuk echo / efek gema
      const echoTimer = setTimeout(() => {
        playVictorySound(0.5);
      }, 800);

      // Ledakkan confetti meriah
      const count = 220;
      const defaults = { origin: { y: 0.65 }, zIndex: 99999 };
      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      return () => {
        clearTimeout(soundTimer);
        clearTimeout(echoTimer);
      };
    }
  }, [isOpen, game]);

  // Render Canvas Grafis Format Potret (9:16 atau 3:4)
  const generateVictoryImage = useCallback(async () => {
    if (!game || !game.players || game.players.length === 0) return;
    setIsGenerating(true);

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const isStory = aspectRatio === '9:16';
      const W = isStory ? 1080 : 900;
      const H = isStory ? 1920 : 1200;
      canvas.width = W;
      canvas.height = H;
      const cx = W / 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Urutkan pemain berdasarkan rank / skor tertinggi
      const sorted = [...game.players].sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        return b.totalScore - a.totalScore;
      });

      const champ = sorted[0];
      const roundsCount = game.totalRounds || (game.rounds ? game.rounds.length : 0);
      const dateText = formatDate(game.finishedAt || game.createdAt);

      // ─────────────────────────────────────────────
      // 1. LATAR BELAKANG (Gaming Dark Slate + Aura Red Ranger)
      // ─────────────────────────────────────────────
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      // Radial Glow merah membara (Ranger Merah) di sekitar sang juara
      const auraY = isStory ? 650 : 440;
      const auraRadius = isStory ? 750 : 500;
      const aura = ctx.createRadialGradient(cx, auraY, 60, cx, auraY, auraRadius);
      aura.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      aura.addColorStop(0.45, 'rgba(185, 28, 28, 0.2)');
      aura.addColorStop(0.8, 'rgba(15, 23, 42, 0.08)');
      aura.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, W, H);

      // Partikel kilau bintang acak
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      const starSeeds = isStory
        ? [
            [120, 180, 2.5], [260, 320, 3], [960, 200, 2.5], [860, 360, 3],
            [140, 720, 3], [940, 740, 2.5], [180, 1120, 2.5], [900, 1160, 3],
            [150, 1620, 3], [920, 1680, 2.5]
          ]
        : [
            [120, 140, 2.5], [220, 260, 3], [780, 160, 2.5], [720, 280, 3],
            [140, 560, 3], [760, 580, 2.5], [160, 920, 2.5], [740, 960, 3]
          ];

      starSeeds.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Frame Border Luar Gradasi Emas-Merah
      const borderGrad = ctx.createLinearGradient(0, 0, W, H);
      borderGrad.addColorStop(0, '#ef4444');
      borderGrad.addColorStop(0.5, '#f59e0b');
      borderGrad.addColorStop(1, '#dc2626');

      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = borderGrad;
      drawRoundedRect(ctx, 24, 24, W - 48, H - 48, 36);
      ctx.stroke();
      ctx.restore();

      // ─────────────────────────────────────────────
      // 2. HEADER: BADGE PERTANDINGAN & TANGGAL
      // ─────────────────────────────────────────────
      const pillW = isStory ? 480 : 420;
      const pillH = isStory ? 44 : 38;
      const pillY = isStory ? 95 : 60;
      const pillX = (W - pillW) / 2;

      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
      ctx.stroke();

      ctx.font = `bold ${isStory ? 17 : 15}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ KOCOK KEKAR • MATCH RESULT ⚡', cx, pillY + (isStory ? 28 : 24));
      ctx.restore();

      // Info Game & Tanggal
      const infoY = isStory ? 175 : 125;
      ctx.font = `600 ${isStory ? 20 : 16}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      const gameTitle = game.name ? `"${game.name}"` : `Game #${game.id}`;
      ctx.fillText(`${gameTitle}  •  ${roundsCount} Round  •  ${dateText}`, cx, infoY);

      // ─────────────────────────────────────────────
      // 3. THE EPIC QUOTE: "GUA LAGI AJE RANGER MERAHNYEEEE" (2-Line Poster)
      // ─────────────────────────────────────────────
      ctx.save();
      ctx.textAlign = 'center';

      // Baris 1: GUA LAGI AJE
      const quoteL1_Y = isStory ? 260 : 185;
      ctx.font = `900 ${isStory ? 38 : 30}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Impact, sans-serif`;
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('GUA LAGI AJE', cx, quoteL1_Y);

      // Baris 2: RANGER MERAHNYEEEE (Besar & Menyala)
      const quoteL2_Y = isStory ? 335 : 245;
      const quoteL2_Size = isStory ? 60 : 48;
      ctx.font = `900 ${quoteL2_Size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Impact, sans-serif`;

      // 3D Shadow bawah teks
      ctx.fillStyle = '#450a0a';
      ctx.fillText('RANGER MERAHNYEEEE', cx, quoteL2_Y + 4);

      // Gradasi Teks Utama Merah Api ke Kuning Emas
      const quoteGrad = ctx.createLinearGradient(cx - 300, 0, cx + 300, 0);
      quoteGrad.addColorStop(0, '#ff3b3b');
      quoteGrad.addColorStop(0.45, '#ff7849');
      quoteGrad.addColorStop(0.75, '#ffbe3b');
      quoteGrad.addColorStop(1, '#ff3b3b');

      ctx.fillStyle = quoteGrad;
      ctx.fillText('RANGER MERAHNYEEEE', cx, quoteL2_Y);

      // Garis tepi tipis bersinar
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeText('RANGER MERAHNYEEEE', cx, quoteL2_Y);
      ctx.restore();

      // Sub-heading Hype
      const subQuoteY = isStory ? 390 : 290;
      ctx.font = `800 ${isStory ? 20 : 16}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('👑 SANG JUARA 1 & PENGUASA MEJA CEKI 👑', cx, subQuoteY);

      // ─────────────────────────────────────────────
      // 4. SPOTLIGHT JUARA 1 (CROWN, AVATAR & NAMA)
      // ─────────────────────────────────────────────
      const avatarCenterX = cx;
      const avatarCenterY = isStory ? 570 : 415;
      const avatarRadius = isStory ? 100 : 76;

      // Mahkota Juara
      ctx.font = `${isStory ? 72 : 56}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('👑', avatarCenterX, avatarCenterY - avatarRadius - 12);

      // Cincin Luar Bersinar (Red Ranger Aura)
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 40;
      const ringGrad = ctx.createLinearGradient(
        avatarCenterX - avatarRadius,
        avatarCenterY - avatarRadius,
        avatarCenterX + avatarRadius,
        avatarCenterY + avatarRadius
      );
      ringGrad.addColorStop(0, '#ef4444');
      ringGrad.addColorStop(0.5, '#f59e0b');
      ringGrad.addColorStop(1, '#ef4444');

      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 7, 0, Math.PI * 2);
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = isStory ? 9 : 7;
      ctx.stroke();
      ctx.restore();

      // Muat Foto Pemain atau Inisial
      let photoDrawn = false;
      if (champ.photoVersion && champ.photoVersion > 0) {
        try {
          const photoUrl = `/api/players/${champ.id}/photo?v=${champ.photoVersion}`;
          const winnerImg = await loadImage(photoUrl);

          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            winnerImg,
            avatarCenterX - avatarRadius,
            avatarCenterY - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
          );
          ctx.restore();
          photoDrawn = true;
        } catch {
          photoDrawn = false;
        }
      }

      if (!photoDrawn) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.fillStyle = champ.color || '#ef4444';
        ctx.fill();

        ctx.font = `900 ${isStory ? 76 : 60}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getInitials(champ.name), avatarCenterX, avatarCenterY);
        ctx.restore();
      }

      // Nama Juara 1
      const winnerNameY = isStory ? 725 : 535;
      ctx.save();
      ctx.font = `900 ${isStory ? 44 : 34}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 14;
      ctx.fillText(champ.name, cx, winnerNameY);
      ctx.restore();

      // Skor Juara 1 Badge Pill
      const scoreBadgeW = isStory ? 340 : 280;
      const scoreBadgeH = isStory ? 54 : 44;
      const scoreBadgeX = (W - scoreBadgeW) / 2;
      const scoreBadgeY = isStory ? 755 : 560;

      ctx.save();
      const scoreBadgeGrad = ctx.createLinearGradient(scoreBadgeX, 0, scoreBadgeX + scoreBadgeW, 0);
      scoreBadgeGrad.addColorStop(0, '#dc2626');
      scoreBadgeGrad.addColorStop(1, '#991b1b');

      ctx.fillStyle = scoreBadgeGrad;
      drawRoundedRect(ctx, scoreBadgeX, scoreBadgeY, scoreBadgeW, scoreBadgeH, scoreBadgeH / 2);
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f87171';
      ctx.stroke();

      ctx.font = `900 ${isStory ? 24 : 19}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const scorePrefix = champ.totalScore > 0 ? '+' : '';
      ctx.fillText(`TOTAL SKOR: ${scorePrefix}${champ.totalScore} POIN`, cx, scoreBadgeY + (isStory ? 35 : 29));
      ctx.restore();

      // ─────────────────────────────────────────────
      // 5. REKAP PAPAN SKOR 4 PEMAIN (KLASEMEN VERTIKAL DALAM POTRET)
      // ─────────────────────────────────────────────
      const tableTitleY = isStory ? 870 : 645;
      ctx.font = `bold ${isStory ? 19 : 15}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 KLASEMEN AKHIR PERTANDINGAN', cx, tableTitleY);

      const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3', '4️⃣ Posisi 4'];
      const cardW = isStory ? 920 : 780;
      const cardH = isStory ? 120 : 86;
      const cardGap = isStory ? 18 : 12;
      const startCardX = (W - cardW) / 2;
      const startCardY = isStory ? 910 : 670;

      sorted.forEach((p, idx) => {
        const y = startCardY + idx * (cardH + cardGap);
        const isChamp = idx === 0;

        ctx.save();
        // Kartu Latar Belakang
        ctx.fillStyle = isChamp ? 'rgba(34, 22, 33, 0.95)' : 'rgba(19, 27, 44, 0.9)';
        drawRoundedRect(ctx, startCardX, y, cardW, cardH, isStory ? 22 : 18);
        ctx.fill();

        // Border Kartu
        ctx.lineWidth = isChamp ? 2.5 : 1.5;
        ctx.strokeStyle = isChamp ? '#ef4444' : '#334155';
        ctx.stroke();

        // Medali & Ranking di Kiri
        ctx.font = `bold ${isStory ? 20 : 16}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = isChamp ? '#fca5a5' : '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(medals[idx] || `${idx + 1}th`, startCardX + (isStory ? 30 : 24), y + cardH / 2 + (isStory ? 7 : 5));

        // Titik Warna Pemain
        const dotX = startCardX + (isStory ? 210 : 165);
        const dotY = y + cardH / 2;
        const dotR = isStory ? 12 : 9;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#10b981';
        ctx.fill();

        // Nama Pemain
        ctx.font = `bold ${isStory ? 26 : 20}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        const maxLen = isStory ? 18 : 15;
        const displayName = p.name.length > maxLen ? p.name.slice(0, maxLen) + '…' : p.name;
        ctx.fillText(displayName, dotX + (isStory ? 26 : 18), dotY + (isStory ? 9 : 7));

        // Skor Pemain di Kanan
        ctx.font = `900 ${isStory ? 34 : 26}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'right';
        if (p.totalScore > 0) {
          ctx.fillStyle = isChamp ? '#fbbf24' : '#34d399';
        } else if (p.totalScore < 0) {
          ctx.fillStyle = '#f87171';
        } else {
          ctx.fillStyle = '#94a3b8';
        }
        const sPrefix = p.totalScore > 0 ? '+' : '';
        ctx.fillText(`${sPrefix}${p.totalScore}`, startCardX + cardW - (isStory ? 30 : 24), dotY + (isStory ? 11 : 9));

        ctx.restore();
      });

      // ─────────────────────────────────────────────
      // 6. FOOTER: WATERMARK & LINK
      // ─────────────────────────────────────────────
      const footerLineY = isStory ? 1800 : 1125;
      const footerTextY = isStory ? 1845 : 1162;

      ctx.save();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startCardX, footerLineY);
      ctx.lineTo(startCardX + cardW, footerLineY);
      ctx.stroke();

      ctx.font = `500 ${isStory ? 17 : 14}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText('🃏 Disimpan dari KOCOK KEKAR • 4 Pemain', startCardX, footerTextY);

      ctx.font = `bold ${isStory ? 17 : 14}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'right';
      ctx.fillText('cekiindongbang.vercel.app', startCardX + cardW, footerTextY);
      ctx.restore();

      // Selesai! Simpan data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setImageUrl(dataUrl);
    } catch (err: any) {
      toast.error('Gagal membuat gambar kemenangan: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [game, aspectRatio]);

  useEffect(() => {
    if (isOpen && game) {
      generateVictoryImage();
    } else {
      setImageUrl(null);
    }
  }, [isOpen, game, generateVictoryImage]);

  // Simpan / Unduh Langsung ke Album (File PNG)
  const handleDownload = () => {
    if (!imageUrl || !game) return;
    try {
      const champ = [...game.players].sort((a, b) => b.totalScore - a.totalScore)[0];
      const safeWinnerName = champ ? champ.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'juara';
      const ratioSlug = aspectRatio.replace(':', 'x');
      const filename = `kocok-kekar-${safeWinnerName}-game-${game.id}-potret-${ratioSlug}.png`;

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Gambar PNG Potret (${aspectRatio}) berhasil disimpan ke galeri/penyimpanan!`);
    } catch {
      toast.error('Gagal mengunduh gambar');
    }
  };

  // Bagikan via Web Share API
  const handleShare = async () => {
    if (!imageUrl || !game) return;
    const champ = [...game.players].sort((a, b) => b.totalScore - a.totalScore)[0];
    const shareText = `🔥 GUA LAGI AJE RANGER MERAHNYEEEE! 🔥\nSelamat kepada ${champ?.name || 'Juara 1'} memenangkan game KOCOK KEKAR!\n\nSkor: ${champ?.totalScore} poin\ncekiindongbang.vercel.app`;
    const ratioSlug = aspectRatio.replace(':', 'x');

    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `kocok-kekar-${game.id}-potret-${ratioSlug}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'GUA LAGI AJE RANGER MERAHNYEEEE',
          text: shareText,
          files: [file],
        });
        toast.success('Berhasil membuka menu share gambar!');
      } else {
        handleDownload();
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        toast.success('Gambar diunduh & caption kemenangan disalin ke clipboard!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        handleDownload();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="👑 Permainan Selesai!"
      description={winner ? `Selamat kepada ${winner.name} sebagai Juara 1!` : 'Klasemen & Hasil Pertandingan'}
      maxWidth="md"
    >
      <div className="flex flex-col gap-3.5 mt-2">
        {/* Hidden Canvas untuk Rendering Resolusi Tinggi */}
        <canvas ref={canvasRef} className="hidden" />

        {/* SPOTLIGHT JUARA 1 & FANFARE SOUND REPLAY */}
        {winner && (
          <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-rose-950/90 border-2 border-rose-500/70 shadow-lg shadow-rose-950/50 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <span className="absolute -top-3 -left-1.5 text-2xl animate-bounce-soft z-10">👑</span>
                <Avatar
                  id={winner.id}
                  name={winner.name}
                  color={winner.color || '#ef4444'}
                  photoVersion={winner.photoVersion || 0}
                  size="md"
                  className="ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500 text-white tracking-wider">
                    👑 Juara 1
                  </span>
                  <span className="text-[11px] font-black text-amber-300">
                    Ranger Merah
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white truncate max-w-[170px] sm:max-w-[240px]">
                  {winner.name}
                </h3>
                <span className="text-xs font-black text-emerald-400 tabular-nums">
                  Total: {winner.totalScore > 0 ? `+${winner.totalScore}` : winner.totalScore} Poin
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => playVictorySound()}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
              title="Mainkan ulang suara kemenangan"
            >
              <Volume2 size={16} />
              <span className="hidden sm:inline">Bunyi Fanfare</span>
            </button>
          </div>
        )}

        {/* Pilihan Ukuran Rasio Potret: 9:16 vs 3:4 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 pl-1">
            Format Gambar:
          </span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                aspectRatio === '9:16'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white/60 dark:bg-slate-700/60 sm:bg-transparent'
              }`}
            >
              9:16 (Status WA / Story HP)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('3:4')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                aspectRatio === '3:4'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white/60 dark:bg-slate-700/60 sm:bg-transparent'
              }`}
            >
              3:4 (Potret Standar)
            </button>
          </div>
        </div>

        {/* GAMBAR YANG SIAP DIBAGIKAN KE LAYAR */}
        <div
          className={`relative w-full max-w-[280px] sm:max-w-[320px] mx-auto ${
            aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[3/4]'
          } rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-2xl flex items-center justify-center transition-all duration-300`}
        >
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 py-12">
              <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Meracik Gambar Siap Bagikan ({aspectRatio})...</span>
            </div>
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`Kartu Kemenangan Ranger Merah Potret ${aspectRatio}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2 py-12">
              <ImageIcon size={20} />
              <span>Gagal memuat kartu</span>
            </div>
          )}

          {/* Badge Format di sudut */}
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-black text-amber-400 tracking-wider">
            {aspectRatio === '9:16' ? 'POTRET 9:16' : 'POTRET 3:4'}
          </div>
        </div>

        {/* Petunjuk Mobile */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center -mt-0.5">
          💡 <strong>Tips di HP:</strong> Gambar di atas siap dibagikan atau tekan lama untuk langsung <em>&ldquo;Simpan Gambar ke Foto&rdquo;</em>.
        </p>

        {/* Tombol Aksi */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!imageUrl || isGenerating}
            className="btn-secondary py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            <Download size={18} className="text-rose-500" />
            <span>Simpan PNG</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={!imageUrl || isGenerating}
            className="btn-primary py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={18} />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span>Bagikan Gambar</span>
              </>
            )}
          </button>
        </div>

        {/* Tombol Mulai Game Baru */}
        {onNewGame && (
          <button
            type="button"
            onClick={onNewGame}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all mt-1"
          >
            <Play size={16} fill="currentColor" />
            <span>Mulai Game Baru</span>
          </button>
        )}
      </div>
    </Modal>
  );
}
