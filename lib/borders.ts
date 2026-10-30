/**
 * Konfigurasi dan Daftar 8 Border Mewah untuk Profil Pemain.
 * File ini menjadi single source of truth untuk whitelist validasi server
 * dan informasi UI pemilihan border.
 */

export type BorderId =
  | 'royal-gold'
  | 'platinum-frost'
  | 'emerald-crown'
  | 'rose-gold-noir'
  | 'sapphire-aurora'
  | 'imperial-ruby'
  | 'diamond-prism'
  | 'celestial-laurel'
  | null;

export interface BorderDefinition {
  id: BorderId;
  name: string;
  description: string;
  badge: string;
  accentColor: string;
}

export const BORDER_WHITELIST: readonly (string | null)[] = [
  null,
  'royal-gold',
  'platinum-frost',
  'emerald-crown',
  'rose-gold-noir',
  'sapphire-aurora',
  'imperial-ruby',
  'diamond-prism',
  'celestial-laurel',
] as const;

export const BORDER_LIST: readonly BorderDefinition[] = [
  {
    id: null,
    name: 'Tanpa Border',
    description: 'Tampilan avatar standar tanpa hiasan bingkai',
    badge: 'Standar',
    accentColor: '#94a3b8',
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Cincin emas metalik berkilau menyapu pelan dengan aksen ganda',
    badge: 'Emas Murni',
    accentColor: '#d4af37',
  },
  {
    id: 'platinum-frost',
    name: 'Platinum Frost',
    description: 'Cincin perak dingin bergradien es dengan bintik kilau berkedip',
    badge: 'Platinum',
    accentColor: '#cbd5e1',
  },
  {
    id: 'emerald-crown',
    name: 'Emerald Crown',
    description: 'Cincin hijau zamrud berhias mahkota emas megah di puncak',
    badge: 'Mahkota Raja',
    accentColor: '#10b981',
  },
  {
    id: 'rose-gold-noir',
    name: 'Rose Gold Noir',
    description: 'Cincin rose gold anggun berpadu hitam pekat dengan glow berdenyut',
    badge: 'Rose Gold',
    accentColor: '#e8b4b8',
  },
  {
    id: 'sapphire-aurora',
    name: 'Sapphire Aurora',
    description: 'Cincin biru safir mistis berputar lambat bagai aurora malam',
    badge: 'Safir Murni',
    accentColor: '#38bdf8',
  },
  {
    id: 'imperial-ruby',
    name: 'Imperial Ruby',
    description: 'Cincin merah rubi membara dengan 4 permata penjuru yang berkilau',
    badge: 'Rubi Kaisar',
    accentColor: '#f43f5e',
  },
  {
    id: 'diamond-prism',
    name: 'Diamond Prism',
    description: 'Cincin holografik prisma pelangi pastel dengan bintang kristal',
    badge: 'Berlian Prisma',
    accentColor: '#c084fc',
  },
  {
    id: 'celestial-laurel',
    name: 'Celestial Laurel',
    description: 'Karangan daun laurel emas kejayaan dengan pita dan debu bintang melayang',
    badge: 'Legendaris',
    accentColor: '#f59e0b',
  },
] as const;

/**
 * Validasi apakah sebuah border ID ada di dalam daftar yang diizinkan.
 */
export function isValidBorderId(id: unknown): id is BorderId {
  if (id === null || id === undefined || id === '') return true;
  return typeof id === 'string' && (BORDER_WHITELIST as readonly unknown[]).includes(id);
}

/**
 * Ambil data konfigurasi border berdasarkan ID.
 * Mengembalikan konfigurasi "Tanpa Border" jika tidak ditemukan.
 */
export function getBorderById(id?: string | null): BorderDefinition {
  if (!id) return BORDER_LIST[0];
  const found = BORDER_LIST.find((b) => b.id === id);
  return found ?? BORDER_LIST[0];
}

