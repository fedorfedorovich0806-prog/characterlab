"use client";

// Сжимает изображение до max стороны и возвращает data URL (JPEG).
export async function compressImage(
  file: File,
  opts: { maxSize?: number; quality?: number } = {},
): Promise<string> {
  const maxSize = opts.maxSize ?? 512;
  const quality = opts.quality ?? 0.85;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    i.src = dataUrl;
  });

  let { width, height } = img;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas не доступен");
  ctx.drawImage(img, 0, 0, width, height);

  // Для картинок с альфой лучше png, иначе jpeg
  const hasAlpha = /\/png$/i.test(file.type);
  const mime = hasAlpha ? "image/png" : "image/jpeg";
  return canvas.toDataURL(mime, quality);
}
