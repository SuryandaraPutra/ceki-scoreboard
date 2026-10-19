'use client';

/**
 * Hook SWR untuk manajemen profil pemain.
 */

import useSWR from 'swr';

export interface PlayerItem {
  id: number;
  name: string;
  color: string;
  photoVersion: number;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePlayers() {
  const { data, error, isLoading, mutate } = useSWR<{ data: PlayerItem[] }>(
    '/api/players',
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const players = data?.data ?? [];
  const activePlayers = players.filter((p) => p.archivedAt === null);
  const archivedPlayers = players.filter((p) => p.archivedAt !== null);

  const createPlayer = async (name: string, color: string) => {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Gagal menambahkan pemain');
    }
    await mutate();
    return result.data as PlayerItem;
  };

  const updatePlayer = async (id: number, data: { name?: string; color?: string }) => {
    const res = await fetch(`/api/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Gagal memperbarui pemain');
    }
    await mutate();
    return result.data as PlayerItem;
  };

  const deletePlayer = async (id: number) => {
    const res = await fetch(`/api/players/${id}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Gagal menghapus pemain');
    }
    await mutate();
    return result;
  };

  const uploadPhoto = async (id: number, photoBlob: Blob) => {
    const formData = new FormData();
    formData.append('photo', photoBlob, 'photo.jpg');

    const res = await fetch(`/api/players/${id}/photo`, {
      method: 'PUT',
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Gagal mengunggah foto');
    }
    await mutate();
    return result.data;
  };

  const deletePhoto = async (id: number) => {
    const res = await fetch(`/api/players/${id}/photo`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Gagal menghapus foto');
    }
    await mutate();
    return result.data;
  };

  return {
    players,
    activePlayers,
    archivedPlayers,
    isLoading,
    isError: Boolean(error),
    createPlayer,
    updatePlayer,
    deletePlayer,
    uploadPhoto,
    deletePhoto,
    refresh: mutate,
  };
}
