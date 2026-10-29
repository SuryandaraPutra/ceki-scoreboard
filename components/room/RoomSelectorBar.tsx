'use client';

/**
 * Bar / Tab Pemilih Meja di halaman game.
 * Menampilkan tab Meja 1, Meja 2, Meja 3, Meja 4 dengan status indikator dot.
 * Satu klik untuk beralih antar meja.
 */

import React, { useState } from 'react';
import { RoomItem } from '@/hooks/useRooms';
import { RoomSelectModal } from './RoomSelectModal';
import { Layers, ChevronDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoomSelectorBarProps {
  rooms: RoomItem[];
  currentRoom: string;
  onSelectRoom: (roomId: string) => void;
}

export function RoomSelectorBar({
  rooms,
  currentRoom,
  onSelectRoom,
}: RoomSelectorBarProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="glass-card p-2 sm:p-2.5 flex items-center justify-between gap-2 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Label & Icon */}
        <div className="hidden md:flex items-center gap-2 pl-2 pr-1 text-slate-500 dark:text-slate-400">
          <Layers size={16} className="text-emerald-500" />
          <span className="text-xs font-bold tracking-tight uppercase">Pilih Meja:</span>
        </div>

        {/* Tab Meja 1, 2, 3, 4 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
          {rooms.map((room) => {
            const isSelected = room.id === currentRoom;
            const isActive = room.status === 'active';

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {/* Status Dot */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive
                      ? isSelected
                        ? 'bg-white animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                      : isSelected
                      ? 'bg-emerald-200'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <span>{room.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    isSelected
                      ? 'bg-emerald-700/60 text-white'
                      : isActive
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {isActive ? 'Aktif' : 'Kosong'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tombol Lihat Semua Detail Meja */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 active:scale-95"
          title="Buka rincian meja"
        >
          <span className="hidden sm:inline">Semua Meja</span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Modal Rincian Meja */}
      <RoomSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rooms={rooms}
        currentRoom={currentRoom}
        onSelectRoom={onSelectRoom}
        onStartNewGame={(roomId) => {
          router.push(`/game/new?room=${roomId}`);
        }}
      />
    </>
  );
}

