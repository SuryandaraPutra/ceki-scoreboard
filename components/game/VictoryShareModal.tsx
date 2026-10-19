'use client';

/**
 * Modal Berbagi Gambar Kemenangan Juara 1 (Format 4:3 PNG):
 * - Menghasilkan gambar grafis resolusi tinggi 1200x900 (aspek rasio 4:3)
 * - Tampilan kemenangan Juara 1 dengan kutipan: "GUA LAGI AJE RANGER MERAHNYEEEE"
 * - Ringkasan papan skor 4 pemain
 * - Tombol "Simpan ke Album Foto (Download PNG)" & "Bagikan Gambar (Web Share API)"
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { formatDate } from '@/lib/constants';
import { getInitials } from '@/lib/calc';
import { Download, Share2, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
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
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src = src;
  });
}

export function VictoryShareModal({ isOpen, onClose, game }: VictoryShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Render Canvas Grafis 1200x900 (4:3)
  const generateVictoryImage = useCallback(async () => {
    if (!game || !game.players || game.players.length === 0) return;
    setIsGenerating(true);

    try {
      // Buat canvas off-screen atau gunakan canvas ref
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Urutkan pemain berdasarkan skor tertinggi
      const sortedPlayers = [...game.players].sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        return b.totalScore - a.totalScore;
      });

      const winner = sortedPlayers[0];
      const roundsCount = game.totalRounds || (game.rounds ? game.rounds.length : 0);
      const dateText = formatDate(game.finishedAt || game.createdAt);

      // ─────────────────────────────────────────────
      // 1. LATAR BELAKANG (Gaming Dark Slate + Aura Red Ranger)
      // ─────────────────────────────────────────────
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 1200, 900);

      // Radial Glow merah membara (Ranger Merah)
      const aura = ctx.createRadialGradient(600, 340, 40, 600, 340, 520);
      aura.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      aura.addColorStop(0.4, 'rgba(185, 28, 28, 0.22)');
      aura.addColorStop(0.8, 'rgba(15, 23, 42, 0.1)');
      aura.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, 1200, 900);

      // Partikel kilau bintang acak halus di latar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      const starSeeds = [
        [150, 120, 2], [280, 240, 3], [1050, 140, 2.5], [920, 260, 2],
        [180, 520, 3], [1020, 540, 2.5], [320, 780, 2], [880, 790, 2.5]
      ];
      starSeeds.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Frame Border Luar Gradasi Emas-Merah
      const borderGrad = ctx.createLinearGradient(0, 0, 1200, 900);
      borderGrad.addColorStop(0, '#ef4444');
      borderGrad.addColorStop(0.5, '#f59e0b');
      borderGrad.addColorStop(1, '#dc2626');

      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = borderGrad;
      drawRoundedRect(ctx, 24, 24, 1152, 852, 32);
      ctx.stroke();
      ctx.restore();

      // ─────────────────────────────────────────────
      // 2. HEADER: BADGE PERTANDINGAN & TANGGAL
      // ─────────────────────────────────────────────
      // Pill Label Ceki Scoreboard
      ctx.save();
      const pillWidth = 430;
      const pillX = (1200 - pillWidth) / 2;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      drawRoundedRect(ctx, pillX, 55, pillWidth, 38, 19);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
      ctx.stroke();

      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ CEKI SCOREBOARD • OFFICIAL MATCH RESULT ⚡', 600, 79);
      ctx.restore();

      // Info Game & Tanggal
      ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      const gameTitle = game.name ? `"${game.name}"` : `Game #${game.id}`;
      ctx.fillText(`${gameTitle}  •  ${roundsCount} Round  •  ${dateText}`, 600, 122);

      // ─────────────────────────────────────────────
      // 3. THE EPIC QUOTE: "GUA LAGI AJE RANGER MERAHNYEEEE"
      // ─────────────────────────────────────────────
      ctx.save();
      ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Impact, sans-serif';
      ctx.textAlign = 'center';

      // 3D Shadow bawah teks
      ctx.fillStyle = '#450a0a';
      ctx.fillText('GUA LAGI AJE RANGER MERAHNYEEEE', 600, 187);

      // Gradasi Teks Utama Merah Api ke Kuning Emas
      const quoteGrad = ctx.createLinearGradient(200, 0, 1000, 0);
      quoteGrad.addColorStop(0, '#ff4343');
      quoteGrad.addColorStop(0.4, '#ff7a3d');
      quoteGrad.addColorStop(0.7, '#ffb82e');
      quoteGrad.addColorStop(1, '#ff3b3b');

      ctx.fillStyle = quoteGrad;
      ctx.fillText('GUA LAGI AJE RANGER MERAHNYEEEE', 600, 184);

      // Garis tepi tipis bersinar
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeText('GUA LAGI AJE RANGER MERAHNYEEEE', 600, 184);
      ctx.restore();

      // Sub-heading Hype
      ctx.font = '800 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('👑 SANG JUARA 1 & PENGUASA MEJA CEKI HARI INI 👑', 600, 222);

      // ─────────────────────────────────────────────
      // 4. SPOTLIGHT JUARA 1 (CROWN, AVATAR & NAMA)
      // ─────────────────────────────────────────────
      const avatarCenterX = 600;
      const avatarCenterY = 360;
      const avatarRadius = 82;

      // Mahkota Juara
      ctx.font = '54px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', avatarCenterX, avatarCenterY - avatarRadius - 10);

      // Cincin Luar Bersinar
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 35;
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
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();

      // Muat Foto Pemain atau Inisial
      let photoDrawn = false;
      if (winner.photoVersion && winner.photoVersion > 0) {
        try {
          const photoUrl = `/api/players/${winner.id}/photo?v=${winner.photoVersion}`;
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
        // Gambar lingkaran avatar berbasis warna pemain + inisial
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.fillStyle = winner.color || '#ef4444';
        ctx.fill();

        ctx.font = '900 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getInitials(winner.name), avatarCenterX, avatarCenterY);
        ctx.restore();
      }

      // Nama Juara 1
      ctx.save();
      ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillText(winner.name, 600, 485);
      ctx.restore();

      // Skor Juara 1 Badge Pill
      ctx.save();
      const scoreBadgeW = 290;
      const scoreBadgeH = 46;
      const scoreBadgeX = (1200 - scoreBadgeW) / 2;
      const scoreBadgeY = 508;

      const scoreBadgeGrad = ctx.createLinearGradient(scoreBadgeX, 0, scoreBadgeX + scoreBadgeW, 0);
      scoreBadgeGrad.addColorStop(0, '#dc2626');
      scoreBadgeGrad.addColorStop(1, '#b91c1c');

      ctx.fillStyle = scoreBadgeGrad;
      drawRoundedRect(ctx, scoreBadgeX, scoreBadgeY, scoreBadgeW, scoreBadgeH, 23);
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f87171';
      ctx.stroke();

      ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const scorePrefix = winner.totalScore > 0 ? '+' : '';
      ctx.fillText(`TOTAL SKOR: ${scorePrefix}${winner.totalScore} POIN`, 600, 539);
      ctx.restore();

      // ─────────────────────────────────────────────
      // 5. REKAP PAPAN SKOR 4 PEMAIN (PODIUM ROW)
      // ─────────────────────────────────────────────
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 KLASEMEN AKHIR PERTANDINGAN', 600, 600);

      const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3', '4️⃣ Posisi 4'];
      const cardW = 255;
      const cardH = 150;
      const cardGap = 24;
      const totalCardsW = 4 * cardW + 3 * cardGap;
      const startCardX = (1200 - totalCardsW) / 2;
      const cardY = 620;

      sortedPlayers.forEach((p, idx) => {
        const x = startCardX + idx * (cardW + cardGap);
        const isChamp = idx === 0;

        ctx.save();
        // Kartu latar
        ctx.fillStyle = isChamp ? 'rgba(34, 22, 33, 0.95)' : 'rgba(19, 27, 44, 0.9)';
        drawRoundedRect(ctx, x, cardY, cardW, cardH, 20);
        ctx.fill();

        // Border kartu
        ctx.lineWidth = isChamp ? 2.5 : 1.5;
        ctx.strokeStyle = isChamp ? '#ef4444' : '#334155';
        ctx.stroke();

        // Label Peringkat
        ctx.font = isChamp ? 'bold 15px system-ui' : '600 14px system-ui';
        ctx.fillStyle = isChamp ? '#fca5a5' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(medals[idx] || `${idx + 1}th`, x + cardW / 2, cardY + 30);

        // Titik warna pemain + Nama
        const dotY = cardY + 62;
        ctx.beginPath();
        ctx.arc(x + 36, dotY, 9, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#10b981';
        ctx.fill();

        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        // Truncate nama jika terlalu panjang
        const maxNameLen = 11;
        const displayName = p.name.length > maxNameLen ? p.name.slice(0, maxNameLen) + '…' : p.name;
        ctx.fillText(displayName, x + 54, dotY + 6);

        // Skor
        ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        if (p.totalScore > 0) {
          ctx.fillStyle = isChamp ? '#fbbf24' : '#34d399';
        } else if (p.totalScore < 0) {
          ctx.fillStyle = '#f87171';
        } else {
          ctx.fillStyle = '#94a3b8';
        }
        const sPrefix = p.totalScore > 0 ? '+' : '';
        ctx.fillText(`${sPrefix}${p.totalScore}`, x + cardW / 2, cardY + 118);

        ctx.restore();
      });

      // ─────────────────────────────────────────────
      // 6. FOOTER: WATERMARK & LINK
      // ─────────────────────────────────────────────
      ctx.save();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, 810);
      ctx.lineTo(1140, 810);
      ctx.stroke();

      ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText('🃏 Disimpan dari Ceki Scoreboard • 4 Pemain', 60, 842);

      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'right';
      ctx.fillText('cekiindongbang.vercel.app', 1140, 842);
      ctx.restore();

      // Selesai! Simpan data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setImageUrl(dataUrl);
    } catch (err: any) {
      toast.error('Gagal membuat gambar kemenangan: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [game]);

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
      const winner = [...game.players].sort((a, b) => b.totalScore - a.totalScore)[0];
      const safeWinnerName = winner ? winner.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'juara';
      const filename = `ceki-ranger-merah-${safeWinnerName}-game-${game.id}.png`;

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Gambar PNG 4:3 berhasil diunduh ke galeri/penyimpanan!');
    } catch {
      toast.error('Gagal mengunduh gambar');
    }
  };

  // Bagikan via Web Share API
  const handleShare = async () => {
    if (!imageUrl || !game) return;
    const winner = [...game.players].sort((a, b) => b.totalScore - a.totalScore)[0];
    const shareText = `🔥 GUA LAGI AJE RANGER MERAHNYEEEE! 🔥\nSelamat kepada ${winner?.name || 'Juara 1'} memenangkan game Ceki!\n\nSkor: ${winner?.totalScore} poin\ncekiindongbang.vercel.app`;

    try {
      // Ubah dataURL ke Blob file
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `ceki-ranger-merah-${game.id}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'GUA LAGI AJE RANGER MERAHNYEEEE',
          text: shareText,
          files: [file],
        });
        toast.success('Berhasil membuka menu share gambar!');
      } else {
        // Fallback: download otomatis dan copy caption
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
      title="🔥 Kartu Kemenangan 4:3 (PNG)"
      description="Siap disimpan ke album foto atau dibagikan ke teman"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Hidden Canvas untuk Rendering Resolusi Tinggi */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Preview Gambar 4:3 */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-2xl flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Meracik Kartu Ranger Merah 4:3...</span>
            </div>
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Kartu Kemenangan Ranger Merah 4:3"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ImageIcon size={20} />
              <span>Gagal memuat kartu</span>
            </div>
          )}

          {/* Badge Format 4:3 di sudut */}
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-black text-amber-400 tracking-wider">
            FORMAT 4:3 (1200×900)
          </div>
        </div>

        {/* Petunjuk Mobile */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center -mt-1">
          💡 <strong>Tips di HP:</strong> Anda juga bisa tekan & tahan (long-press) gambar di atas untuk langsung <em>&ldquo;Simpan Gambar ke Foto&rdquo;</em>.
        </p>

        {/* Tombol Aksi */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!imageUrl || isGenerating}
            className="btn-secondary py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            <Download size={18} className="text-emerald-500" />
            <span>Simpan ke Album (PNG)</span>
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
      </div>
    </Modal>
  );
}
