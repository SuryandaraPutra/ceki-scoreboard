'use client';

/**
 * Halaman Manajemen Profil Pemain (/players):
 * - Tambah pemain baru
 * - Edit nama dan warna tema
 * - Upload & crop foto profil (lingkaran, 256x256 JPEG)
 * - Hapus pemain (soft-delete jika punya riwayat, hard-delete jika belum)
 * - Tampilkan pemain diarsipkan dengan tombol aktifkan kembali
 */

import React, { useState } from 'react';
import { usePlayers, type PlayerItem } from '@/hooks/usePlayers';
import { Avatar } from '@/components/ui/Avatar';
import { PlayerModal } from '@/components/player/PlayerModal';
import { PhotoCropModal } from '@/components/player/PhotoCropModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PinLockModal } from '@/components/ui/PinLockModal';
import { Plus, Edit2, Trash2, Camera, Archive, CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function PlayersPage() {
  const {
    players,
    activePlayers,
    archivedPlayers,
    isLoading,
    createPlayer,
    updatePlayer,
    deletePlayer,
    uploadPhoto,
    deletePhoto,
  } = usePlayers();

  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // State Modal
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerItem | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoPlayer, setPhotoPlayer] = useState<PlayerItem | null>(null);

  const [deleteConfirmPlayer, setDeleteConfirmPlayer] = useState<PlayerItem | null>(null);

  // Filter pemain berdasarkan pencarian
  const displayedPlayers = (showArchived ? players : activePlayers).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setEditingPlayer(null);
    setIsPlayerModalOpen(true);
  };

  const handleOpenEdit = (p: PlayerItem) => {
    setEditingPlayer(p);
    setIsPlayerModalOpen(true);
  };

  const handleOpenPhoto = (p: PlayerItem) => {
    setPhotoPlayer(p);
    setIsPhotoModalOpen(true);
  };

  const handleSavePlayer = async (data: { name: string; color: string }) => {
    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, data);
    } else {
      await createPlayer(data.name, data.color);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmPlayer) return;
    try {
      const res = await deletePlayer(deleteConfirmPlayer.id);
      toast.success(res.message || 'Pemain berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pemain');
    }
  };

  const handleRestore = async (p: PlayerItem) => {
    try {
      await updatePlayer(p.id, { name: p.name });
      toast.success(`Pemain "${p.name}" berhasil diaktifkan kembali`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memulihkan pemain');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Profil Pemain
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola profil 4 pemain, warna tema, dan foto profil lingkaran
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto py-2.5 px-5 text-xs font-bold"
        >
          <Plus size={18} />
          <span>Tambah Pemain</span>
        </button>
      </div>

      {/* Bar Pencarian & Filter Arsip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pemain..."
            className="input-field pl-10 py-2.5 text-xs"
          />
        </div>

        {archivedPlayers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              showArchived
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Archive size={15} />
            <span>
              {showArchived
                ? `Sembunyikan Arsip (${archivedPlayers.length})`
                : `Lihat Arsip (${archivedPlayers.length})`}
            </span>
          </button>
        )}
      </div>

      {/* Grid Kartu Pemain */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 h-28 skeleton" />
          ))}
        </div>
      ) : displayedPlayers.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
            <Plus size={28} />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            {search ? 'Tidak ada pemain yang cocok' : 'Belum Ada Pemain'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {search
              ? 'Coba gunakan kata kunci pencarian yang lain'
              : 'Tambahkan minimal 4 pemain untuk mulai bermain game kartu Ceki'}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="btn-primary mt-4 py-2 px-5 text-xs font-bold"
            >
              Tambah Pemain Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPlayers.map((player) => {
            const isArchived = player.archivedAt !== null;
            return (
              <div
                key={player.id}
                className={`glass-card p-4 sm:p-5 flex items-center justify-between gap-3 transition-all ${
                  isArchived ? 'opacity-65 bg-slate-100/50 dark:bg-slate-900/40' : ''
                }`}
                style={{
                  borderLeft: `5px solid ${player.color}`,
                }}
              >
                {/* Info Pemain & Avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group shrink-0">
                    <Avatar
                      id={player.id}
                      name={player.name}
                      color={player.color}
                      photoVersion={player.photoVersion}
                      size="lg"
                    />
                    {!isArchived && (
                      <button
                        onClick={() => handleOpenPhoto(player)}
                        className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Ubah foto"
                      >
                        <Camera size={18} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
                        {player.name}
                      </span>
                      {isArchived && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold shrink-0">
                          diarsipkan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-xs text-slate-400 capitalize">
                        Tema Pemain
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center gap-1 shrink-0">
                  {isArchived ? (
                    <button
                      onClick={() => handleRestore(player)}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                      title="Aktifkan kembali pemain ini"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenPhoto(player)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Upload/Ganti Foto"
                      >
                        <Camera size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(player)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Profil"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmPlayer(player)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Hapus Pemain"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah/Edit Profil */}
      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        player={editingPlayer}
        onSave={handleSavePlayer}
        onOpenPhotoCrop={() => {
          if (editingPlayer) {
            setIsPlayerModalOpen(false);
            handleOpenPhoto(editingPlayer);
          }
        }}
      />

      {/* Modal Crop & Kompresi Foto */}
      {photoPlayer && (
        <PhotoCropModal
          isOpen={isPhotoModalOpen}
          onClose={() => {
            setIsPhotoModalOpen(false);
            setPhotoPlayer(null);
          }}
          playerName={photoPlayer.name}
          hasPhoto={photoPlayer.photoVersion > 0}
          onUpload={(blob) => uploadPhoto(photoPlayer.id, blob)}
          onDeletePhoto={() => deletePhoto(photoPlayer.id)}
        />
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmPlayer)}
        onClose={() => setDeleteConfirmPlayer(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus / Arsipkan Pemain"
        message={
          deleteConfirmPlayer
            ? `Apakah Anda yakin ingin menghapus "${deleteConfirmPlayer.name}"?\n\nJika pemain ini sudah memiliki riwayat game, profil akan diarsipkan agar riwayat skor tetap utuh.`
            : ''
        }
        confirmText="Hapus"
        isDanger
      />

      {/* Modal Kunci Keamanan PIN Tambah Pemain */}
      <PinLockModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="HEH MAO DIAPAIN SI!"
        description="Fitur tambah pemain terkunci! Masukkan kode PIN untuk melanjutkan."
      />
    </div>
  );
}
