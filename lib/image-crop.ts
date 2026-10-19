/**
 * Utilitas pemotongan gambar lingkaran dan kompresi JPEG di sisi klien.
 * Mengubah area potong menjadi gambar 256x256 JPEG dengan kualitas 0.85
 * sebelum diunggah ke server.
 */

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Buat elemen HTMLImageElement dari URL data
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Potong gambar sesuai crop area dan resize ke 256x256 JPEG
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia');
  }

  // Ukuran target: 256x256 piksel
  const targetSize = 256;
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Gambar area crop yang dipilih ke canvas 256x256
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  // Kompresi ke format image/jpeg dengan kualitas 0.85
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal menghasilkan Blob gambar'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.85
    );
  });
}
