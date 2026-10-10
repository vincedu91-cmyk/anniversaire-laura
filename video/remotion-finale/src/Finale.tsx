import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { buildTiles, CELL, COLS, ROWS, Tile, Univers } from "./mosaic";

// Final « 18 » — plan OUT_* de timeline.json, recalé en temps local (0 s = 5:35 du film).
// L'audio (voix off, scintillements, feu d'artifice, applaudissements) est mixé dans HyperFrames :
// ce rendu est muet et ses repères visuels suivent les SFX ci-dessous.

loadFont({ family: "Bricolage Grotesque", url: staticFile("fonts/BricolageGrotesque-latin.woff2"), weight: "200 800" });
loadFont({ family: "Geist Mono", url: staticFile("fonts/GeistMono-latin.woff2"), weight: "100 900" });

export type FinaleProps = {
  photos: string[]; // chemins dans public/ (vide = tuiles colorées, aucun souvenir inventé)
};

const S = (seconds: number, fps: number) => Math.round(seconds * fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);

const T = {
  flashEnd: 0.5, // transition « flash doré »
  staggerS: 0.04, // OUT_MOSAIC_ASSEMBLY : stagger 0,04 s
  pullBackStart: 12, // OUT_MOSAIC_HOLD : 347 → 352
  pullBackEnd: 17,
  message: 17, // OUT_FINAL_MESSAGE (352)
  fireworks: [17.8, 19.4, 20.8], // explosions de SFX_OUT_FEU_ARTIFICE (352 + 0,8 / 2,4 / 3,8)
  fadeStart: 22, // fondu au noir 357 → 360
  end: 25,
};

const PALETTES: Record<Univers, string[]> = {
  enfance: ["#E7B9C4", "#B6D2E8", "#DAD3EC", "#F0E1A0"],
  ado: ["#FF2BD6", "#7B2BFF", "#00F0FF", "#2D5BFF"],
  betises: ["#FFD400", "#E5202E", "#17B857", "#1F4FE0"],
};
const GOLD = "#FFD27A";
const CREAM = "#F4EBDD";
const TILES = buildTiles();
const GRID_LEFT = (1920 - COLS * CELL) / 2;
const GRID_TOP = (1080 - ROWS * CELL) / 2;

type TileProps = { tile: Tile; photo: string | null; sweep: number };

const MosaicTile = ({ tile, photo, sweep }: TileProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, delay: S(T.flashEnd + tile.order * T.staggerS, fps), config: { damping: 13, mass: 0.7 } });
  const x = GRID_LEFT + tile.col * CELL + interpolate(p, [0, 1], [tile.fromX, 0]);
  const y = GRID_TOP + tile.row * CELL + interpolate(p, [0, 1], [tile.fromY, 0]);
  const shine = Math.exp(-(((tile.col + tile.row) - sweep) ** 2) / 10); // reflet doré qui balaie la mosaïque
  const palette = PALETTES[tile.univers];
  const color = palette[Math.floor(tile.shade * palette.length)];
  return (
    <div
      style={{
        position: "absolute",
        left: x + 3,
        top: y + 3,
        width: CELL - 6,
        height: CELL - 6,
        borderRadius: 6,
        overflow: "hidden",
        opacity: interpolate(p, [0, 0.15], [0, 1], clamp),
        transform: `rotate(${interpolate(p, [0, 1], [tile.fromRotation, 0])}deg) scale(${interpolate(p, [0, 1], [0.4, 1])})`,
        background: color,
        boxShadow: `0 0 ${8 + 18 * shine}px rgba(255, 210, 122, ${0.25 + 0.6 * shine})`,
      }}
    >
      {photo ? <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      {/* teinte dorée 10 % (tile_look « gold_tint_10pct ») + reflet */}
      <AbsoluteFill style={{ background: GOLD, opacity: 0.12 + 0.45 * shine }} />
    </div>
  );
};

const Bokeh = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: 24 }, (_, i) => {
        const size = 80 + random(`bokeh-size-${i}`) * 200;
        const drift = Math.sin(frame / 90 + i) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`bokeh-x-${i}`) * 1920 - size / 2,
              top: random(`bokeh-y-${i}`) * 1080 - size / 2 + drift,
              width: size,
              height: size,
              borderRadius: "50%",
              background: GOLD,
              opacity: 0.05 + random(`bokeh-o-${i}`) * 0.1,
              filter: "blur(18px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const FIREWORK_SPOTS = [
  { x: 470, y: 300 },
  { x: 1450, y: 250 },
  { x: 960, y: 170 },
];
const SPARK_COLORS = [GOLD, CREAM, "#E7B9C4", "#FFD400"];

const Fireworks = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {T.fireworks.map((at, k) => {
        const local = frame - S(at, fps);
        if (local < 0 || local > S(2, fps)) return null;
        const t = interpolate(local, [0, S(1.4, fps)], [0, 1], { ...clamp, easing: EASE_OUT });
        const fade = interpolate(local, [S(0.6, fps), S(2, fps)], [1, 0], clamp);
        const spot = FIREWORK_SPOTS[k];
        return Array.from({ length: 30 }, (_, i) => {
          const angle = (i / 30) * Math.PI * 2;
          const dist = 170 + random(`spark-${k}-${i}`) * 90;
          const gravity = (local / fps) ** 2 * 60;
          return (
            <div
              key={`${k}-${i}`}
              style={{
                position: "absolute",
                left: spot.x + Math.cos(angle) * dist * t - 4,
                top: spot.y + Math.sin(angle) * dist * t + gravity - 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: SPARK_COLORS[i % SPARK_COLORS.length],
                opacity: fade,
                boxShadow: `0 0 12px ${GOLD}`,
              }}
            />
          );
        });
      })}
    </AbsoluteFill>
  );
};

const Message = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l1 = interpolate(frame, [S(T.message + 0.3, fps), S(T.message + 1.1, fps)], [0, 1], { ...clamp, easing: EASE_OUT });
  const name = spring({ frame, fps, delay: S(T.message + 0.8, fps), config: { damping: 11, mass: 0.8 } });
  const meta = interpolate(frame, [S(T.message + 1.8, fps), S(T.message + 2.6, fps)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: "Bricolage Grotesque", textAlign: "center" }}>
      <div style={{ fontSize: 92, fontWeight: 300, color: CREAM, opacity: l1, transform: `translateY(${(1 - l1) * 40}px)` }}>
        Joyeux 18<sup style={{ fontSize: 52 }}>e</sup> anniversaire,
      </div>
      <div
        style={{
          fontSize: 250,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 1.05,
          color: GOLD,
          opacity: interpolate(name, [0, 0.3], [0, 1], clamp),
          transform: `scale(${interpolate(name, [0, 1], [1.4, 1])})`,
          textShadow: "0 0 60px rgba(255, 210, 122, 0.35)",
        }}
      >
        Laura !
      </div>
      <div style={{ marginTop: 28, fontFamily: "Geist Mono", fontSize: 24, letterSpacing: "0.42em", color: "#D8CFC2", opacity: meta }}>
        JUILLET 2009 · 18 ANS
      </div>
    </AbsoluteFill>
  );
};

export const Finale = ({ photos }: FinaleProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pull = interpolate(frame, [S(T.pullBackStart, fps), S(T.pullBackEnd, fps)], [1, 0.88], { ...clamp, easing: EASE_IN_OUT });
  const sweep = interpolate(frame, [S(T.pullBackStart, fps), S(T.pullBackEnd, fps)], [-12, 52], clamp);
  const dim = interpolate(frame, [S(T.message, fps), S(T.message + 1, fps)], [1, 0.3], clamp);
  const flash = interpolate(frame, [0, S(T.flashEnd, fps)], [0.9, 0], clamp);
  const black = interpolate(frame, [S(T.fadeStart, fps), S(T.end, fps)], [0, 1], { ...clamp, easing: EASE_IN_OUT });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(70% 70% at 50% 45%, #1d1409 0%, #070605 70%)" }}>
      <Bokeh />
      <AbsoluteFill style={{ transform: `scale(${pull})`, opacity: dim }}>
        {TILES.map((tile, i) => (
          <MosaicTile key={i} tile={tile} photo={photos.length ? photos[i % photos.length] : null} sweep={sweep} />
        ))}
      </AbsoluteFill>
      <Fireworks />
      <Message />
      <AbsoluteFill style={{ background: GOLD, opacity: flash }} />
      <AbsoluteFill style={{ background: "#000000", opacity: black }} />
    </AbsoluteFill>
  );
};
