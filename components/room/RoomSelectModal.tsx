'use client';

/**
 * Modal untuk memilih Room / Meja permainan kartu Ceki.
 * Menampilkan status real-time setiap meja (sedang bermain vs kosong)
 * beserta nama pemain dan round berjalan jika aktif.
 */

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { RoomItem } from '@/hooks/useRooms';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Tv, Play, Check, Sparkles } from 'lucide-react';

interface RoomSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomItem[];
  currentRoom: string;
  onSelectRoom: (roomId: string) => void;
  onStartNewGame?: (roomId: string) => void;
}

export function RoomSelectModal({
  isOpen,
  onClose,
  rooms,
  currentRoom,
  onSelectRoom,
  onStartNewGame,
}: RoomSelectModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pilih Meja Permainan" maxWidth="xl">
      <div className="flex flex-col gap-4">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Pilih meja untuk melihat skor atau memulai hitungan baru. Beberapa perangkat dapat menggunakan meja berbeda secara bersamaan tanpa saling mengganggu.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-1">
          {rooms.map((room) => {
            const isSelected = room.id === currentRoom;
            const isActive = room.status === 'active';
            const game = room.activeGame;

            return (
              <div
                key={room.id}
                onClick={() => {
                  onSelectRoom(room.id);
                  onClose();
                }}
                className={`relative rounded-3xl p-4 cursor-pointer transition-all border-2 text-left flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-white/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header Meja & Badge Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {room.name}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center gap-1">
                        <Check size={11} strokeWidth={3} />
                        <span>Meja Anda</span>
                      </span>
                    )}
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Sedang Main</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Kosong</span>
                    </span>
                  )}
                </div>

                {/* Info Konten Meja */}
                {isActive && game ? (
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                        {game.name || `Game #${game.id}`}
                      </span>
                      <span className="font-semibold text-[11px]">
                        Round #{game.roundCount + 1}
                      </span>
                    </div>

                    {/* 4 Pemain Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {game.players.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate max-w-[65px] text-slate-700 dark:text-slate-300">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            ({p.totalScore})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 py-2 text-center text-slate-400 dark:text-slate-500">
                    <span className="text-xs font-medium">Meja ini belum ada permainan aktif.</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Klik untuk mulai berhitung di meja ini →
                    </span>
                  </div>
                )}

                {/* Tombol aksi cepat */}
                <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isSelected ? '✓ Sedang Terpilih' : 'Pilih Meja Ini'}
                  </span>
                  {!isActive && onStartNewGame && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRoom(room.id);
                        onClose();
                        onStartNewGame(room.id);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Play size={10} fill="currentColor" />
                      <span>Mulai Main</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

