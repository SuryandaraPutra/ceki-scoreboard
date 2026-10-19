'use client';

/**
 * Modal untuk memilih, meng-crop lingkaran, dan mengunggah foto profil pemain.
 * Menggunakan react-easy-crop dan kompresi JPEG 256x256 di klien.
 */

import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Modal } from '../ui/Modal';
import { getCroppedImg, type Area } from '@/lib/image-crop';
import { Camera, Upload, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  hasPhoto: boolean;
  onUpload: (blob: Blob) => Promise<any>;
  onDeletePhoto?: () => Promise<any>;
}

export function PhotoCropModal({
  isOpen,
  onClose,
  playerName,
  hasPhoto,
  onUpload,
  onDeletePhoto,
}: PhotoCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Callback saat crop selesai digeser/zoom
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Baca file gambar dari input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop file gambar
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImageSrc(reader.result as string);
          setZoom(1);
          setCrop({ x: 0, y: 0 });
        });
        reader.readAsDataURL(file);
      } else {
        toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      }
    }
  };

  // Simpan foto setelah di-crop lingkaran dan dikompresi
  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      // Kompresi di sisi klien: crop lingkaran, resize ke 256x256, JPEG kualitas 0.85
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      await onUpload(croppedBlob);
      toast.success('Foto profil berhasil diperbarui');
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses foto');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hapus foto profil yang sudah ada
  const handleDeletePhoto = async () => {
    if (!onDeletePhoto) return;
    try {
      setIsProcessing(true);
      await onDeletePhoto();
      toast.success('Foto profil berhasil dihapus');
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus foto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setZoom(1);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Foto Profil: ${playerName}`}
      description="Pilih foto dan sesuaikan posisi lingkaran"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Area Pilih / Drop Foto atau Cropper */}
        {!imageSrc ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-center group"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera size={32} />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Pilih dari Galeri atau Kamera HP
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Bisa juga geser & lepaskan file gambar ke sini (JPG, PNG, WebP)
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Cropper Container */}
            <div className="relative w-full h-64 bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-3 px-2">
              <ZoomOut size={18} className="text-slate-400 shrink-0" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <ZoomIn size={18} className="text-slate-400 shrink-0" />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 px-1">
              <span>Geser untuk memposisikan</span>
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Pilih foto lain
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {hasPhoto && !imageSrc && (
            <button
              type="button"
              onClick={handleDeletePhoto}
              disabled={isProcessing}
              className="btn-danger flex items-center gap-1.5 py-2.5 px-4 text-xs"
            >
              <Trash2 size={16} />
              <span>Hapus Foto</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="btn-secondary py-2.5 px-4 text-xs font-semibold"
            >
              Batal
            </button>

            {imageSrc && (
              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={isProcessing}
                className="btn-primary flex items-center gap-1.5 py-2.5 px-5 text-xs font-semibold"
              >
                <Upload size={16} />
                <span>{isProcessing ? 'Menyimpan...' : 'Simpan Foto'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
