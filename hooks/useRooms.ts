'use client';

/**
 * Hook untuk mengelola daftar Room / Meja dan Room yang sedang aktif/dipilih.
 * - Mengambil status semua meja dari /api/rooms secara berkala (5 detik)
 * - Menyimpan room yang dipilih di localStorage ('ceki_room')
 * - Mendukung sinkronisasi antar komponen dan parameter URL ?room=
 */

import useSWR from 'swr';
import { useState, useEffect, useCallback } from 'react';

export interface RoomPlayer {
  id: number;
  name: string;
  color: string;
  totalScore: number;
  rank: number;
}

export interface RoomItem {
  id: string;
  name: string;
  status: 'active' | 'empty';
  activeGame: {
    id: number;
    name: string | null;
    startedAt: number;
    scoreLimit: number | null;
    roundCount: number;
    players: RoomPlayer[];
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRooms() {
  const [currentRoom, setCurrentRoomState] = useState<string>('1');
  const [isInitialized, setIsInitialized] = useState(false);

  // Ambil data status semua room dengan SWR
  const { data, error, isLoading, mutate } = useSWR<{ data: RoomItem[] }>(
    '/api/rooms',
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      isPaused: () => typeof document !== 'undefined' && document.visibilityState !== 'visible',
    }
  );

  const rooms: RoomItem[] = data?.data || [
    { id: '1', name: 'Meja 1', status: 'empty', activeGame: null },
    { id: '2', name: 'Meja 2', status: 'empty', activeGame: null },
    { id: '3', name: 'Meja 3', status: 'empty', activeGame: null },
    { id: '4', name: 'Meja 4', status: 'empty', activeGame: null },
  ];

  // Inisialisasi dari URL query ?room= atau localStorage saat client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      const savedRoom = localStorage.getItem('ceki_room');

      if (urlRoom) {
        setCurrentRoomState(urlRoom);
        localStorage.setItem('ceki_room', urlRoom);
      } else if (savedRoom) {
        setCurrentRoomState(savedRoom);
      }
      setIsInitialized(true);
    }
  }, []);

  // Update room terpilih
  const selectRoom = useCallback((roomId: string) => {
    setCurrentRoomState(roomId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ceki_room', roomId);
      // Buat custom event agar komponen lain dalam window yang sama langsung update
      window.dispatchEvent(new CustomEvent('ceki-room-change', { detail: roomId }));
    }
  }, []);

  // Dengarkan event perubahan room dari tab lain atau event lokal
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ceki_room' && e.newValue) {
        setCurrentRoomState(e.newValue);
      }
    };

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentRoomState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('ceki-room-change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ceki-room-change', handleCustom);
    };
  }, []);

  const currentRoomData = rooms.find((r) => r.id === currentRoom) || {
    id: currentRoom,
    name: `Meja ${currentRoom}`,
    status: 'empty' as const,
    activeGame: null,
  };

  return {
    rooms,
    currentRoom,
    currentRoomData,
    selectRoom,
    isLoading,
    isInitialized,
    refreshRooms: mutate,
  };
}

