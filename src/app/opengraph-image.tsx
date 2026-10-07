import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { ogThumbs } from "@/data/photos";

export const alt = "LAURA 18 ANS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLS = 12;
const ROWS = 6;
const TILE_W = size.width / COLS;
const TILE_H = size.height / ROWS;
// Sans photos, la mosaïque reprend les couleurs des trois univers.
const FALLBACK = ["#E7B9C4", "#B6D2E8", "#F0E1A0", "#FF2BD6", "#00F0FF", "#7B2BFF", "#FFD400", "#E5202E", "#17B857", "#1F4FE0"];

async function thumbnails(): Promise<string[]> {
  const loaded = await Promise.all(
    ogThumbs.map(async (src) => {
      try {
        const data = await readFile(path.join(process.cwd(), "public", src));
        return `data:image/jpeg;base64,${data.toString("base64")}`;
      } catch {
        return null;
      }
    }),
  );
  return loaded.filter((item): item is string => item !== null);
}

/** Image de partage dédiée: mosaïque de photos + LAURA / 18 ANS (jamais une capture du hero). */
export default async function OpengraphImage() {
  const photos = await thumbnails();
  const tiles = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, photo: photos.length ? photos[i % photos.length] : null }));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#070605" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexWrap: "wrap" }}>
          {tiles.map(({ i, photo }) =>
            photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={photo} width={TILE_W} height={TILE_H} alt="" style={{ objectFit: "cover" }} />
            ) : (
              <div key={i} style={{ width: TILE_W, height: TILE_H, background: FALLBACK[(i * 7) % FALLBACK.length] }} />
            ),
          )}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "rgba(7,6,5,0.62)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
          <div style={{ display: "flex", fontSize: 230, fontWeight: 800, color: "#F4EBDD", letterSpacing: -10, lineHeight: 0.9 }}>LAURA</div>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800, color: "#FFD27A", letterSpacing: -6, lineHeight: 1 }}>18 ANS</div>
        </div>
      </div>
    ),
    size,
  );
}
