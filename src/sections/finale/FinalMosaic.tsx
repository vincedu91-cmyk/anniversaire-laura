"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { adolescence } from "@/data/adolescence";
import { childhood } from "@/data/childhood";
import { mischief } from "@/data/mischief";
import type { Photo } from "@/data/types";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { mosaicAssemble } from "@/motion/presets";

// Chiffres 1 et 8 en cellules (# = une photo).
const ONE = [
  "..##..",
  ".###..",
  "####..",
  "..##..",
  "..##..",
  "..##..",
  "..##..",
  "..##..",
  ".####.",
] as const;
const EIGHT = [
  ".####.",
  "##..##",
  "##..##",
  ".####.",
  ".####.",
  "##..##",
  "##..##",
  "##..##",
  ".####.",
] as const;

const DIGIT_COLS = 6;
const DIGIT_ROWS = 9;
const GAP = 1;

interface Cell {
  /** Position desktop (chiffres côte à côte) et mobile (empilés), en unités de tuile. */
  dx: number;
  dy: number;
  mx: number;
  my: number;
}

function cellsOf(rows: readonly string[], digitIndex: 0 | 1): Cell[] {
  const cells: Cell[] = [];
  rows.forEach((row, y) => {
    Array.from(row).forEach((char, x) => {
      if (char !== "#") return;
      cells.push({
        dx: x + digitIndex * (DIGIT_COLS + GAP),
        dy: y,
        mx: x,
        my: y + digitIndex * (DIGIT_ROWS + GAP),
      });
    });
  });
  return cells;
}

const CELLS: readonly Cell[] = [...cellsOf(ONE, 0), ...cellsOf(EIGHT, 1)];

// Générateur pseudo-aléatoire déterministe: le même éparpillement à chaque rendu (pas d'écart serveur/client).
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface Scatter {
  ox: number;
  oy: number;
  rotate: number;
  scale: number;
  appear: number;
  assemble: number;
}

const SCATTER: readonly Scatter[] = (() => {
  const random = mulberry32(1807);
  const order = CELLS.map((_, i) => i).sort(() => random() - 0.5);
  return CELLS.map((_, i) => ({
    ox: (random() - 0.5) * 78,
    oy: (random() - 0.5) * 72,
    rotate: (random() - 0.5) * 70,
    scale: 0.6 + random() * 1.1,
    appear: 0.04 + (order.indexOf(i) / CELLS.length) * 0.38,
    assemble: mosaicAssemble.assembleStart + random() * 0.14,
  }));
})();

/** Les photos des trois univers, entrelacées pour remplir les tuiles. */
function mosaicPhotos(): Photo[] {
  const pools = [childhood.photos, adolescence.photos, mischief.photos];
  const real = pools.map((pool) => pool.filter((photo) => !photo.placeholder));
  const source = real.some((pool) => pool.length > 0) ? real.filter((pool) => pool.length > 0) : pools;
  return CELLS.map((_, i) => {
    const pool = source[i % source.length];
    return pool[Math.floor(i / source.length) % pool.length];
  });
}
const TILE_PHOTOS = mosaicPhotos();

function Tile({ progress, cell, scatter, photo, index }: { progress: MotionValue<number>; cell: Cell; scatter: Scatter; photo: Photo; index: number }) {
  const appearEnd = scatter.appear + mosaicAssemble.appearSpan;
  const assembleEnd = scatter.assemble + mosaicAssemble.assembleSpan;
  const opacity = useTransform(progress, [scatter.appear, appearEnd], [0, 1]);
  const x = useTransform(progress, [0, scatter.assemble, assembleEnd], [`${scatter.ox}vw`, `${scatter.ox}vw`, "0vw"]);
  const y = useTransform(progress, [0, scatter.assemble, assembleEnd], [`${scatter.oy}vh`, `${scatter.oy}vh`, "0vh"]);
  const rotate = useTransform(progress, [scatter.assemble, assembleEnd], [scatter.rotate, 0]);
  const scale = useTransform(progress, [scatter.appear, appearEnd, scatter.assemble, assembleEnd], [scatter.scale * 0.5, scatter.scale, scatter.scale, 1]);

  return (
    <motion.div
      data-m
      aria-hidden="true"
      className="absolute left-[calc(var(--x)*var(--tile))] top-[calc(var(--y)*var(--tile))] h-(--tile) w-(--tile) p-[2px] [--x:var(--dx)] [--y:var(--dy)] max-md:[--x:var(--mx)] max-md:[--y:var(--my)]"
      style={{
        opacity, x, y, rotate, scale,
        ["--dx" as string]: cell.dx,
        ["--dy" as string]: cell.dy,
        ["--mx" as string]: cell.mx,
        ["--my" as string]: cell.my,
      }}
    >
      <PhotoFrame photo={photo} index={index} sizes="12vw" />
    </motion.div>
  );
}

function Stage({ progress }: { progress: MotionValue<number> }) {
  const settle = useTransform(progress, [0.86, 1], [1, 0.94]);
  return (
    <>
      <div className="rm-hide absolute inset-0 grid place-items-center">
        <motion.div
          data-m
          className="relative h-[calc(var(--rows)*var(--tile))] w-[calc(var(--cols)*var(--tile))] [--cols:13] [--rows:9] [--tile:min(6vw,8.6dvh)] max-md:[--cols:6] max-md:[--rows:19] max-md:[--tile:min(14vw,4.6dvh)]"
          style={{ scale: settle }}
        >
          {CELLS.map((cell, i) => (
            <Tile key={i} progress={progress} cell={cell} scatter={SCATTER[i]} photo={TILE_PHOTOS[i]} index={i} />
          ))}
        </motion.div>
      </div>

      <div className="rm-only px-6 py-24">
        <div className="relative mx-auto h-[calc(var(--rows)*var(--tile))] w-[calc(var(--cols)*var(--tile))] [--cols:13] [--rows:9] [--tile:min(6vw,8.6dvh)] max-md:[--cols:6] max-md:[--rows:19] max-md:[--tile:min(14vw,4.6dvh)]">
          {CELLS.map((cell, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute left-[calc(var(--x)*var(--tile))] top-[calc(var(--y)*var(--tile))] h-(--tile) w-(--tile) p-[2px] [--x:var(--dx)] [--y:var(--dy)] max-md:[--x:var(--mx)] max-md:[--y:var(--my)]"
              style={{ ["--dx" as string]: cell.dx, ["--dy" as string]: cell.dy, ["--mx" as string]: cell.mx, ["--my" as string]: cell.my }}
            >
              <PhotoFrame photo={TILE_PHOTOS[i]} index={i} sizes="12vw" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** Finale: dans le noir, des photos apparaissent une à une, puis s'assemblent pour former 18. */
export function FinalMosaic() {
  return (
    <ScrollStory
      id="finale"
      scene="finale"
      universe="finale"
      height="420vh"
      label="Mosaïque finale: 18"
      stageClassName="bg-finale-background text-finale-ink"
    >
      {(progress) => (
        <>
          <h2 className="sr-only">Dix-huit ans de souvenirs</h2>
          <Stage progress={progress} />
        </>
      )}
    </ScrollStory>
  );
}
