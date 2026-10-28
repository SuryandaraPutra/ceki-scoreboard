/**
 * Fungsi kalkulasi skor, peringkat, dan statistik Ceki Scoreboard.
 *
 * Semua kalkulasi dilakukan dari data round (tidak disimpan ganda di DB).
 * Fungsi ini dipakai di API route dan bisa dipakai di client (tanpa import DB).
 */

// ─────────────────────────────────────────────
// TIPE DATA
// ─────────────────────────────────────────────

export interface PlayerScore {
  playerId: number;
  playerName: string;
  totalScore: number;
  rank: number;         // 1-based, seri = rank sama
  roundScores: number[]; // skor per round (index = roundNo - 1)
  resetRounds?: number[]; // round di mana pemain ini di-reset ke 0 karena terbalap lawan
}

export interface RoundResetDetail {
  roundNo: number;
  playerId: number;
  playerName: string;
  scoreBeforeReset: number;
  overtakenByPlayerId: number;
  overtakenByPlayerName: string;
  overtakerScore: number;
}

export interface DetailedGameScores {
  players: PlayerScore[];
  roundResets: Record<number, number[]>; // roundNo -> array playerId yang hangus ke 0
  resetDetails: RoundResetDetail[]; // detail lengkap tiap kejadian balap
  latestRoundResets: RoundResetDetail[]; // detail balap pada round paling akhir
}

export interface RoundData {
  roundNo: number;
  scores: Record<number, number>; // playerId → skor round
}

export interface GameResult {
  players: PlayerScore[];
  winners: number[];   // playerId pemain dengan rank 1 (bisa seri)
  isFinished: boolean;
}

export interface LeaderboardEntry {
  playerId: number;
  playerName: string;
  playerColor: string;
  photoVersion: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;      // 0-1
  totalPoints: number;
  avgPointsPerGame: number;
  highestRoundScore: number;
  currentWinStreak: number;
  longestWinStreak: number;
}

export interface RecordEntry {
  value: number;
  playerId: number;
  playerName: string;
  playerColor: string;
  photoVersion: number;
  gameName: string | null;
  gameId: number;
  date: number; // unix timestamp
}

export interface Records {
  highestGameScore: RecordEntry | null;
  highestRoundScore: RecordEntry | null;
  biggestWinMargin: RecordEntry | null;
  longestWinStreak: RecordEntry | null;
}

// ─────────────────────────────────────────────
// KALKULASI SKOR & PERINGKAT
// ─────────────────────────────────────────────

/**
 * Hitung kalkulasi skor terperinci beserta kejadian balap (overtake) skor 100 ke atas.
 *
 * Aturan Balap 100+:
 * Apabila seorang pemain berada pada skor 100 ke atas (baik sebelum round atau setelah penambahan poin round ini),
 * lalu pemain lawan yang tadinya di bawah atau sejajar membalapnya dengan selisih >= 5 poin di atasnya,
 * maka pemain yang terbalap skornya otomatis menjadi 0!
 * (Jika skor akhir sama/seri, misal 150 dan 150, tidak di-reset karena tidak ada selisih).
 */
export function calculateScoresDetailed(
  playerIds: number[],
  playerNames: Record<number, string>,
  initialScore: number,
  rounds: RoundData[],
  winCondition: 'highest' | 'lowest'
): DetailedGameScores {
  const totals: Record<number, number> = {};
  const roundScoresByPlayer: Record<number, number[]> = {};
  const resetRoundsByPlayer: Record<number, number[]> = {};

  for (const pid of playerIds) {
    totals[pid] = initialScore;
    roundScoresByPlayer[pid] = [];
    resetRoundsByPlayer[pid] = [];
  }

  // Susun round berdasarkan roundNo agar urutan konsisten
  const sortedRounds = [...rounds].sort((a, b) => a.roundNo - b.roundNo);
  const roundResetsMap: Record<number, number[]> = {};
  const allResetDetails: RoundResetDetail[] = [];

  for (const round of sortedRounds) {
    const prevTotals = { ...totals };
    const tempTotals: Record<number, number> = {};

    for (const pid of playerIds) {
      const score = round.scores[pid] ?? 0;
      tempTotals[pid] = prevTotals[pid] + score;
      roundScoresByPlayer[pid].push(score);
    }

    const resetPidsThisRound = new Set<number>();
    const detailsThisRound: RoundResetDetail[] = [];

    // Aturan Balap 100+: hanya berlaku pada mode skor tertinggi
    if (winCondition === 'highest') {
      for (const pidA of playerIds) {
        // Pemain A sudah berada pada skor 100 ke atas sebelum round ini
        const isAbove100 = prevTotals[pidA] >= 100;
        if (!isAbove100) continue;

        // Cek apakah ada lawan B yang membalap pemain A dengan selisih >= 5 poin
        for (const pidB of playerIds) {
          if (pidA === pidB) continue;

          // Pemain B awalnya berada di bawah atau sejajar pemain A sebelum round ini
          const wasBehindOrTied = prevTotals[pidA] >= prevTotals[pidB];

          // Dan sekarang pemain B berada di atas pemain A dengan selisih >= 5 poin
          const isOvertakenBy5 = tempTotals[pidB] >= tempTotals[pidA] + 5;

          if (wasBehindOrTied && isOvertakenBy5) {
            resetPidsThisRound.add(pidA);
            detailsThisRound.push({
              roundNo: round.roundNo,
              playerId: pidA,
              playerName: playerNames[pidA] ?? `Pemain ${pidA}`,
              scoreBeforeReset: tempTotals[pidA],
              overtakenByPlayerId: pidB,
              overtakenByPlayerName: playerNames[pidB] ?? `Pemain ${pidB}`,
              overtakerScore: tempTotals[pidB],
            });
            break; // Pemain A sudah pasti di-reset ke 0 untuk round ini
          }
        }
      }
    }

    // Terapkan reset ke 0 untuk pemain yang terbalap pada round ini
    for (const pid of playerIds) {
      if (resetPidsThisRound.has(pid)) {
        totals[pid] = 0;
        resetRoundsByPlayer[pid].push(round.roundNo);
      } else {
        totals[pid] = tempTotals[pid];
      }
    }

    if (resetPidsThisRound.size > 0) {
      roundResetsMap[round.roundNo] = Array.from(resetPidsThisRound);
      allResetDetails.push(...detailsThisRound);
    }
  }

  // Susun pemain berdasarkan total skor
  const sorted = [...playerIds].sort((a, b) =>
    winCondition === 'highest'
      ? totals[b] - totals[a]
      : totals[a] - totals[b]
  );

  // Tentukan peringkat (seri = rank sama, tidak ada lompatan rank)
  const ranks: Record<number, number> = {};
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && totals[sorted[i]] !== totals[sorted[i - 1]]) {
      currentRank = i + 1;
    }
    ranks[sorted[i]] = currentRank;
  }

  const playersResult: PlayerScore[] = sorted.map((pid) => ({
    playerId: pid,
    playerName: playerNames[pid] ?? `Pemain ${pid}`,
    totalScore: totals[pid],
    rank: ranks[pid],
    roundScores: roundScoresByPlayer[pid],
    resetRounds: resetRoundsByPlayer[pid],
  }));

  const lastRoundNo = sortedRounds.length > 0 ? sortedRounds[sortedRounds.length - 1].roundNo : 0;
  const latestRoundResets = allResetDetails.filter((d) => d.roundNo === lastRoundNo);

  return {
    players: playersResult,
    roundResets: roundResetsMap,
    resetDetails: allResetDetails,
    latestRoundResets,
  };
}

/**
 * Hitung total skor dan peringkat semua pemain dari data round.
 *
 * @param playerIds - Array 4 player ID (urutan seat)
 * @param playerNames - Map playerId → nama
 * @param initialScore - Skor awal tiap pemain
 * @param rounds - Data semua round
 * @param winCondition - 'highest' atau 'lowest'
 * @returns Array PlayerScore terurut berdasarkan peringkat
 */
export function calculateScores(
  playerIds: number[],
  playerNames: Record<number, string>,
  initialScore: number,
  rounds: RoundData[],
  winCondition: 'highest' | 'lowest'
): PlayerScore[] {
  return calculateScoresDetailed(
    playerIds,
    playerNames,
    initialScore,
    rounds,
    winCondition
  ).players;
}

/**
 * Tentukan pemenang dari hasil kalkulasi skor.
 * Pemenang = semua pemain dengan rank 1 (bisa seri).
 */
export function determineWinners(players: PlayerScore[]): number[] {
  return players.filter((p) => p.rank === 1).map((p) => p.playerId);
}

// ─────────────────────────────────────────────
// CEK BATAS SKOR
// ─────────────────────────────────────────────

/**
 * Cek apakah salah satu pemain telah menyentuh atau melebihi batas skor.
 *
 * @returns Array playerId yang telah menyentuh batas (kosong = belum ada)
 */
export function checkScoreLimit(
  players: PlayerScore[],
  scoreLimit: number | null
): number[] {
  if (!scoreLimit) return [];
  return players
    .filter((p) => p.totalScore >= scoreLimit)
    .map((p) => p.playerId);
}

/**
 * Hitung progres pemain menuju batas skor (0-1, bisa melebihi 1).
 */
export function calculateProgress(
  totalScore: number,
  initialScore: number,
  scoreLimit: number | null
): number {
  if (!scoreLimit || scoreLimit <= initialScore) return 0;
  const range = scoreLimit - initialScore;
  const progress = (totalScore - initialScore) / range;
  return Math.max(0, progress);
}

// ─────────────────────────────────────────────
// VALIDASI ZERO-SUM
// ─────────────────────────────────────────────

/**
 * Validasi bahwa total skor semua pemain dalam satu round = 0.
 */
export function validateZeroSum(scores: Record<number, number>): boolean {
  const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
  return total === 0;
}

// ─────────────────────────────────────────────
// STATISTIK LEADERBOARD
// ─────────────────────────────────────────────

export interface FinishedGameData {
  gameId: number;
  gameName: string | null;
  finishedAt: number;
  winCondition: 'highest' | 'lowest';
  initialScore: number;
  playerScores: { playerId: number; totalScore: number }[];
}

/**
 * Hitung statistik leaderboard dari semua game selesai.
 */
export function calculateLeaderboard(
  games: FinishedGameData[],
  playerInfo: Record<
    number,
    { name: string; color: string; photoVersion: number }
  >
): LeaderboardEntry[] {
  // Akumulasi data per pemain
  const stats: Record<
    number,
    {
      gamesPlayed: number;
      wins: number;
      totalPoints: number;
      highestRoundScore: number;
      winHistory: boolean[]; // true = menang
    }
  > = {};

  // Inisialisasi semua pemain yang diketahui
  for (const pid of Object.keys(playerInfo).map(Number)) {
    stats[pid] = {
      gamesPlayed: 0,
      wins: 0,
      totalPoints: 0,
      highestRoundScore: 0,
      winHistory: [],
    };
  }

  // Proses tiap game
  for (const game of games) {
    if (game.playerScores.length === 0) continue;

    // Tentukan skor terbaik (winner score)
    const scores = game.playerScores;
    const bestScore =
      game.winCondition === 'highest'
        ? Math.max(...scores.map((s) => s.totalScore))
        : Math.min(...scores.map((s) => s.totalScore));

    for (const { playerId, totalScore } of scores) {
      if (!stats[playerId]) {
        stats[playerId] = {
          gamesPlayed: 0,
          wins: 0,
          totalPoints: 0,
          highestRoundScore: 0,
          winHistory: [],
        };
      }

      const isWinner = totalScore === bestScore;
      stats[playerId].gamesPlayed++;
      stats[playerId].totalPoints += totalScore;
      stats[playerId].wins += isWinner ? 1 : 0;
      stats[playerId].winHistory.push(isWinner);
      stats[playerId].highestRoundScore = Math.max(
        stats[playerId].highestRoundScore,
        totalScore
      );
    }
  }

  // Hitung streak menang
  return Object.entries(stats)
    .filter(([, s]) => s.gamesPlayed > 0)
    .map(([pidStr, s]) => {
      const pid = Number(pidStr);
      const info = playerInfo[pid];

      // Hitung streak menang terpanjang dan streak saat ini
      let longestStreak = 0;
      let currentStreak = 0;
      let tempStreak = 0;

      for (const won of s.winHistory) {
        if (won) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Streak saat ini = streak dari belakang
      for (let i = s.winHistory.length - 1; i >= 0; i--) {
        if (s.winHistory[i]) currentStreak++;
        else break;
      }

      return {
        playerId: pid,
        playerName: info?.name ?? `Pemain ${pid}`,
        playerColor: info?.color ?? '#10b981',
        photoVersion: info?.photoVersion ?? 0,
        gamesPlayed: s.gamesPlayed,
        wins: s.wins,
        winRate: s.gamesPlayed > 0 ? s.wins / s.gamesPlayed : 0,
        totalPoints: s.totalPoints,
        avgPointsPerGame:
          s.gamesPlayed > 0 ? s.totalPoints / s.gamesPlayed : 0,
        highestRoundScore: s.highestRoundScore,
        currentWinStreak: currentStreak,
        longestWinStreak: longestStreak,
      };
    });
}

// ─────────────────────────────────────────────
// UTIL: FORMAT ANGKA
// ─────────────────────────────────────────────

/**
 * Format angka skor dengan tanda + untuk positif.
 */
export function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return String(score);
}

/**
 * Format win rate sebagai persentase.
 */
export function formatWinRate(winRate: number): string {
  return `${Math.round(winRate * 100)}%`;
}

/**
 * Ringkasan skor game untuk dibagikan via WhatsApp / clipboard.
 */
export function formatGameSummary(
  gameName: string | null,
  players: PlayerScore[],
  date: Date
): string {
  const dateStr = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const medal = ['🥇', '🥈', '🥉', '4️⃣'];

  const lines = [
    `🎴 *KOCOK KEKAR*`,
    gameName ? `📋 ${gameName}` : '',
    `📅 ${dateStr}`,
    ``,
    `*Hasil Akhir:*`,
    ...players.map((p) => {
      const m = medal[p.rank - 1] ?? '  ';
      return `${m} ${p.playerName}: *${p.totalScore}* poin`;
    }),
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * Warna warna pemain yang dipakai di seluruh aplikasi.
 * 8 pilihan warna curated (non-generic).
 */
export const PLAYER_COLORS = [
  { label: 'Emerald', value: '#10b981' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Pink', value: '#ec4899' },
];

/**
 * Generate warna gradient avatar dari warna tema pemain.
 */
export function getAvatarGradient(color: string): string {
  // Buat versi lebih gelap dari warna yang sama
  return `linear-gradient(135deg, ${color}dd, ${color}88)`;
}

/**
 * Ambil inisial dari nama pemain (maks 2 karakter).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Parse quick values dari JSON string ke array number.
 */
export function parseQuickValues(jsonStr: string): number[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((v) => typeof v === 'number' && v > 0);
    }
  } catch {
    // Jika gagal parse, gunakan default
  }
  return [5, 15, 25];
}

