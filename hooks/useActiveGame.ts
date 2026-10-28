'use client';

/**
 * Hook SWR untuk game aktif dengan polling sinkronisasi 5 detik (hanya saat tab terlihat).
 */

import useSWR from 'swr';
import { useCallback } from 'react';

export interface ActiveGamePlayer {
  id: number;
  name: string;
  color: string;
  photoVersion: number;
  seatOrder: number;
  totalScore: number;
  rank: number;
  roundScores: number[];
  resetRounds?: number[];
  wasResetToZero?: boolean;
  progress: number;
  hasReachedLimit: boolean;
}

export interface ActiveGameRound {
  roundNo: number;
  scores: Record<number, number>;
}

export interface ActiveGameData {
  id: number;
  name: string | null;
  status: 'active' | 'finished';
  winCondition: 'highest' | 'lowest';
  initialScore: number;
  scoreLimit: number | null;
  scoreLimitAction: 'notify' | 'ask' | 'auto';
  zeroSum: boolean;
  quickValues: number[];
  targetRounds: number | null;
  startedAt: number;
  createdAt: number;
  players: ActiveGamePlayer[];
  rounds: ActiveGameRound[];
  roundResets?: Record<number, number[]>;
  hasReachedScoreLimit: boolean;
  playersReachedLimit: number[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useActiveGame() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ActiveGameData | null }>(
    '/api/games/active',
    fetcher,
    {
      // Polling tiap 5 detik
      refreshInterval: 5000,
      revalidateOnFocus: true,
      // Polling hanya berjalan jika tab browser sedang aktif/terlihat
      isPaused: () => typeof document !== 'undefined' && document.visibilityState !== 'visible',
    }
  );

  const game = data?.data ?? null;

  /**
   * Simpan round baru
   */
  const saveRound = useCallback(
    async (scores: Record<number, number>) => {
      if (!game) return;

      const res = await fetch(`/api/games/${game.id}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal menyimpan round');
      }

      await mutate();
      return result.data;
    },
    [game, mutate]
  );

  /**
   * Edit skor round yang sudah ada
   */
  const updateRound = useCallback(
    async (roundNo: number, scores: Record<number, number>) => {
      if (!game) return;

      const res = await fetch(`/api/games/${game.id}/rounds/${roundNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal memperbarui round');
      }

      await mutate();
      return result;
    },
    [game, mutate]
  );

  /**
   * Hapus round / Undo round terakhir
   */
  const deleteRound = useCallback(
    async (roundNo: number) => {
      if (!game) return;

      const res = await fetch(`/api/games/${game.id}/rounds/${roundNo}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal menghapus round');
      }

      await mutate();
      return result;
    },
    [game, mutate]
  );

  /**
   * Ubah pengaturan game yang sedang berjalan (nama, batas skor, aksi, zero-sum)
   */
  const updateGameSettings = useCallback(
    async (patch: {
      name?: string;
      scoreLimit?: number | null;
      scoreLimitAction?: 'notify' | 'ask' | 'auto';
      zeroSum?: boolean;
    }) => {
      if (!game) return;

      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal memperbarui pengaturan game');
      }

      await mutate();
      return result.data;
    },
    [game, mutate]
  );

  /**
   * Akhiri game
   */
  const finishGame = useCallback(async () => {
    if (!game) return;

    const res = await fetch(`/api/games/${game.id}/finish`, {
      method: 'POST',
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Gagal mengakhiri game');
    }

    await mutate();
    return result.data;
  }, [game, mutate]);

  return {
    game,
    isLoading,
    isError: Boolean(error),
    saveRound,
    updateRound,
    deleteRound,
    updateGameSettings,
    finishGame,
    refresh: mutate,
  };
}
