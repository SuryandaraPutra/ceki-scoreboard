'use client';

/**
 * Halaman Leaderboard & Rekor Tertinggi (/leaderboard):
 * - Filter periode: Minggu ini, Bulan ini, Semua
 * - Pengurutan: Menang, Total Poin, Win Rate
 * - Podium Top 3 pemain dengan foto profil
 * - Tabel lengkap statistik pemain
 * - 4 Kartu Rekor Tertinggi: Skor Game, Skor Round, Selisih Kemenangan, dan Win Streak
 */

import React, { useState } from 'react';
import useSWR from 'swr';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/constants';
import { formatWinRate } from '@/lib/calc';
import {
  Trophy,
  Flame,
  Award,
  Zap,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [sort, setSort] = useState<'wins' | 'points' | 'winrate'>('wins');

  const { data, isLoading } = useSWR(
    `/api/leaderboard?period=${period}&sort=${sort}`,
    fetcher
  );

  const leaderboard = data?.data?.leaderboard ?? [];
  const records = data?.data?.records ?? {};

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const medalIcons = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>Leaderboard & Rekor</span>
          <Trophy size={24} className="text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Peringkat performa pemain dari seluruh game yang telah selesai
        </p>
      </div>

      {/* Kontrol Filter Periode & Urutan */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Periode */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 self-start">
          {[
            { id: 'all', label: 'Semua Waktu' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'week', label: 'Minggu Ini' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Urutkan Berdasarkan */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Urutkan:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="input-field text-xs py-2 px-3 w-auto font-bold"
          >
            <option value="wins">Kemenangan Terbanyak</option>
            <option value="points">Total Poin Tertinggi</option>
            <option value="winrate">Win Rate (%)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-64 rounded-3xl skeleton" />
          <div className="h-48 rounded-3xl skeleton" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <Trophy size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Data Game Selesai
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Mainkan dan selesaikan game kartu Ceki untuk memunculkan peringkat pemain dan rekor di sini.
          </p>
        </div>
      ) : (
        <>
          {/* PODIUM TOP 3 */}
          {top3.length > 0 && (
            <div className="glass-card p-5 sm:p-8 flex flex-col items-center">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                Podium Juara
              </span>

              <div className="grid grid-cols-3 gap-2 sm:gap-6 w-full max-w-lg items-end pt-2">
                {/* Juara 2 (Kiri) */}
                {top3[1] ? (
                  <div className="flex flex-col items-center text-center">
                    <span className="text-2xl mb-1">{medalIcons[1]}</span>
                    <Avatar
                      id={top3[1].playerId}
                      name={top3[1].playerName}
                      color={top3[1].playerColor}
                      photoVersion={top3[1].photoVersion}
                      size="lg"
                    />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-2 truncate max-w-full">
                      {top3[1].playerName}
                    </span>
                    <span className="text-xs font-black text-slate-500 tabular-nums">
                      {top3[1].wins} Menang • {formatWinRate(top3[1].winRate)}
                    </span>
                    <div className="w-full h-20 bg-slate-200/80 dark:bg-slate-800 rounded-t-2xl mt-3 flex items-center justify-center font-black text-slate-400 text-lg">
                      2
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Juara 1 (Tengah - Lebih Tinggi) */}
                {top3[0] && (
                  <div className="flex flex-col items-center text-center -mt-6">
                    <span className="text-3xl mb-1 animate-bounce-soft">{medalIcons[0]}</span>
                    <Avatar
                      id={top3[0].playerId}
                      name={top3[0].playerName}
                      color={top3[0].playerColor}
                      photoVersion={top3[0].photoVersion}
                      size="xl"
                      className="ring-4 ring-amber-400"
                    />
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-2 truncate max-w-full">
                      {top3[0].playerName}
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {top3[0].wins} Menang • {top3[0].totalPoints} Poin
                    </span>
                    <div className="w-full h-28 bg-gradient-to-t from-amber-400 to-amber-300 dark:from-amber-600 dark:to-amber-500 rounded-t-2xl mt-3 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-amber-500/25">
                      1
                    </div>
                  </div>
                )}

                {/* Juara 3 (Kanan) */}
                {top3[2] ? (
                  <div className="flex flex-col items-center text-center">
                    <span className="text-2xl mb-1">{medalIcons[2]}</span>
                    <Avatar
                      id={top3[2].playerId}
                      name={top3[2].playerName}
                      color={top3[2].playerColor}
                      photoVersion={top3[2].photoVersion}
                      size="lg"
                    />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-2 truncate max-w-full">
                      {top3[2].playerName}
                    </span>
                    <span className="text-xs font-black text-slate-500 tabular-nums">
                      {top3[2].wins} Menang • {formatWinRate(top3[2].winRate)}
                    </span>
                    <div className="w-full h-14 bg-slate-200/80 dark:bg-slate-800 rounded-t-2xl mt-3 flex items-center justify-center font-black text-slate-400 text-lg">
                      3
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </div>
          )}

          {/* TABEL LENGKAP LEADERBOARD */}
          <div className="glass-card p-4 sm:p-6 overflow-hidden">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-3">
              Tabel Statistik Lengkap
            </h3>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                    <th className="py-2.5 px-3 w-12">#</th>
                    <th className="py-2.5 px-3">Pemain</th>
                    <th className="py-2.5 px-3 text-center">Main</th>
                    <th className="py-2.5 px-3 text-center">Menang</th>
                    <th className="py-2.5 px-3 text-center">Win Rate</th>
                    <th className="py-2.5 px-3 text-right">Total Poin</th>
                    <th className="py-2.5 px-3 text-right">Rata-Rata</th>
                    <th className="py-2.5 px-3 text-right">Skor Tertinggi</th>
                    <th className="py-2.5 px-3 text-center">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {leaderboard.map((entry: any, index: number) => {
                    const medal = medalIcons[index] ?? `${index + 1}`;
                    return (
                      <tr
                        key={entry.playerId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-slate-500">
                          {medal}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              id={entry.playerId}
                              name={entry.playerName}
                              color={entry.playerColor}
                              photoVersion={entry.photoVersion}
                              size="sm"
                            />
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                              {entry.playerName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 tabular-nums">
                          {entry.gamesPlayed}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {entry.wins}
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums">
                          {formatWinRate(entry.winRate)}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
                          {entry.totalPoints}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 tabular-nums">
                          {Math.round(entry.avgPointsPerGame)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                          {entry.highestRoundScore}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {entry.currentWinStreak > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black">
                              <Flame size={12} fill="currentColor" />
                              <span>{entry.currentWinStreak}x</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              Max: {entry.longestWinStreak}x
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4 KARTU REKOR TERTINGGI */}
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>Rekor Permainan Ceki</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Rekor 1: Skor Game Tertinggi */}
              <div className="glass-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Skor Game Tertinggi</span>
                    <Trophy size={16} className="text-amber-500" />
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {records.highestGameScore ? records.highestGameScore.value : '-'}
                  </span>
                </div>
                {records.highestGameScore && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Avatar
                      id={records.highestGameScore.playerId}
                      name={records.highestGameScore.playerName}
                      color={records.highestGameScore.playerColor}
                      photoVersion={records.highestGameScore.photoVersion}
                      size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {records.highestGameScore.playerName}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {formatDate(records.highestGameScore.date)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rekor 2: Skor Round Tertinggi */}
              <div className="glass-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Skor 1 Round Tertinggi</span>
                    <Zap size={16} className="text-sky-500" />
                  </div>
                  <span className="text-2xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
                    {records.highestRoundScore ? `+${records.highestRoundScore.value}` : '-'}
                  </span>
                </div>
                {records.highestRoundScore && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Avatar
                      id={records.highestRoundScore.playerId}
                      name={records.highestRoundScore.playerName}
                      color={records.highestRoundScore.playerColor}
                      photoVersion={records.highestRoundScore.photoVersion}
                      size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {records.highestRoundScore.playerName}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {formatDate(records.highestRoundScore.date)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rekor 3: Selisih Kemenangan Terbesar */}
              <div className="glass-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Selisih Kemenangan</span>
                    <TrendingUp size={16} className="text-rose-500" />
                  </div>
                  <span className="text-2xl font-black text-rose-500 tabular-nums">
                    {records.biggestWinMargin ? `Δ ${records.biggestWinMargin.value}` : '-'}
                  </span>
                </div>
                {records.biggestWinMargin && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Avatar
                      id={records.biggestWinMargin.playerId}
                      name={records.biggestWinMargin.playerName}
                      color={records.biggestWinMargin.playerColor}
                      photoVersion={records.biggestWinMargin.photoVersion}
                      size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {records.biggestWinMargin.playerName}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {formatDate(records.biggestWinMargin.date)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rekor 4: Win Streak Terpanjang */}
              <div className="glass-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Win Streak Terpanjang</span>
                    <Flame size={16} className="text-amber-500" />
                  </div>
                  <span className="text-2xl font-black text-amber-500 tabular-nums">
                    {records.longestWinStreak ? `${records.longestWinStreak.value}x` : '-'}
                  </span>
                </div>
                {records.longestWinStreak && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Avatar
                      id={records.longestWinStreak.playerId}
                      name={records.longestWinStreak.playerName}
                      color={records.longestWinStreak.playerColor}
                      photoVersion={records.longestWinStreak.photoVersion}
                      size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {records.longestWinStreak.playerName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Rekor beruntun
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
