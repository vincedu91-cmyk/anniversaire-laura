import { MAIN_SIDE, THUMB_SIDE } from "@/data/party";

export interface PreparedPhoto {
  main: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

// Le stockage refuse au-delà de 2 Mo: on baisse la qualité par paliers si besoin.
const MAIN_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.5] as const;
const MAIN_MAX_BYTES = 1_900_000;
const THUMB_QUALITY = 0.72;

type Source = ImageBitmap | HTMLImageElement;

/** Décode la photo en tenant compte de l'orientation EXIF (photos prises à la verticale). */
async function decode(file: File): Promise<{ source: Source; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // repli sur l'élément image (navigateurs anciens)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob && blob.type === "image/jpeg" ? resolve(blob) : reject(new Error("Encodage JPEG indisponible"))),
      "image/jpeg",
      quality,
    );
  });
}

async function render(source: Source, width: number, height: number, side: number, qualities: readonly number[], maxBytes: number): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, side / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible");
  context.fillStyle = "#fff"; // les PNG transparents deviennent blancs plutôt que noirs
  context.fillRect(0, 0, w, h);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, w, h);
  try {
    let blob = await toJpeg(canvas, qualities[0]);
    for (let i = 1; i < qualities.length && blob.size > maxBytes; i += 1) blob = await toJpeg(canvas, qualities[i]);
    return { blob, width: w, height: h };
  } finally {
    canvas.width = 0; // libère la mémoire (important sur téléphone)
    canvas.height = 0;
  }
}

/** Réduit la photo (2000 px, JPEG) et fabrique sa miniature, tout se passe sur le téléphone. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const decoded = await decode(file);
  try {
    const main = await render(decoded.source, decoded.width, decoded.height, MAIN_SIDE, MAIN_QUALITY_STEPS, MAIN_MAX_BYTES);
    const thumb = await render(decoded.source, decoded.width, decoded.height, THUMB_SIDE, [THUMB_QUALITY], Infinity);
    return { main: main.blob, thumb: thumb.blob, width: main.width, height: main.height };
  } finally {
    decoded.release();
  }
}
