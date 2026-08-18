/**
 * Client-side image downscale + re-encode.
 *
 * A phone photo is routinely 4-8MB and 4000px wide, which is slow to upload
 * over mobile data and far larger than anything the experience displays.
 * Shrinking before upload is the single biggest win for perceived speed.
 *
 * Best-effort by design: any failure should fall back to the original file
 * rather than block the upload.
 */

const MAX_DIMENSION = 2000;
const QUALITY = 0.82;
/** Below this, re-encoding usually costs more quality than it saves bytes. */
const SKIP_BELOW_BYTES = 400 * 1024;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  // Never re-encode formats where it would be lossy or pointless.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (file.size < SKIP_BELOW_BYTES) return file;
  if (typeof createImageBitmap !== 'function') return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  );

  // Keep the original if compression didn't actually help.
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
}
