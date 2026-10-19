'use client';

/**
 * Hook SWR untuk pengaturan global aplikasi.
 */

import useSWR from 'swr';

export interface AppSettings {
  id: number;
  defaultScoreLimit: number | null;
  defaultScoreLimitAction: 'notify' | 'ask' | 'auto';
  defaultWinCondition: 'highest' | 'lowest';
  defaultInitialScore: number;
  defaultQuickValues: number[];
  roundScoreMin: number;
  roundScoreMax: number;
  defaultZeroSum: boolean;
  vibration: boolean;
  theme: 'system' | 'light' | 'dark';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<{ data: AppSettings }>(
    '/api/settings',
    fetcher
  );

  const settings = data?.data;

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || 'Gagal menyimpan pengaturan');
    }

    await mutate();
    return result.data as AppSettings;
  };

  return {
    settings,
    isLoading,
    isError: Boolean(error),
    updateSettings,
    refresh: mutate,
  };
}
