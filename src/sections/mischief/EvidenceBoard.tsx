"use client";

import { motion } from "motion/react";
import { evidenceLabel, personalities } from "@/data/mischief";
import type { Photo } from "@/data/types";
import { MemoryPhoto } from "@/components/media/MemoryPhoto";
import { ComicAnnotation } from "@/components/shared/ComicAnnotation";
import { Sticker } from "@/components/shared/Sticker";
import { comicPop } from "@/motion/presets";
import { duration, ease, stagger, viewport } from "@/motion/tokens";

type Point = readonly [number, number];

// Positions (centre, en % du tableau) pour desktop (large) et mobile (haut).
const DESKTOP: readonly Point[] = [[14, 24], [40, 16], [70, 26], [24, 70], [52, 62], [84, 72]];
const MOBILE: readonly Point[] = [[32, 8], [70, 26], [28, 42], [70, 58], [30, 74], [68, 92]];
// Fils rouges entre les preuves (indices).
const LINKS: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [1, 4], [0, 3], [3, 4], [4, 5], [2, 5]];

function Strings({ points, className }: { points: readonly Point[]; className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      {LINKS.map(([a, b], i) => (
        <motion.path
          key={`${a}-${b}`}
          d={`M${points[a][0]},${points[a][1]} L${points[b][0]},${points[b][1]}`}
          stroke="var(--color-mischief-primary)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={viewport.early}
          transition={{ duration: duration.slow, delay: 0.4 + i * stagger.loose, ease: ease.out }}
        />
      ))}
    </svg>
  );
}

/** Mur d'enquête humoristique: preuves épinglées reliées par des fils rouges qui se dessinent. */
export function EvidenceBoard({ photos, group }: { photos: readonly Photo[]; group: readonly Photo[] }) {
  return (
    <section aria-label="Mur d'enquête" className="relative bg-mischief-blue px-4 py-[14dvh] text-mischief-paper md:pl-44 md:pr-[6vw]">
      <div className="mb-[8dvh]">
        <p className="mono">DOSSIER SECRET</p>
        <h3 className="display text-[clamp(3rem,10vw,10rem)]">LES BÊTISES DE LAURA</h3>
      </div>

      <div className="relative mx-auto aspect-[3/5] w-full max-w-[34rem] md:aspect-[16/10] md:max-w-none">
        <Strings points={MOBILE} className="md:hidden" />
        <Strings points={DESKTOP} className="max-md:hidden" />
        {photos.slice(0, DESKTOP.length).map((photo, i) => {
          const personality = personalities[i % personalities.length];
          return (
            <motion.div
              key={`${photo.id}-${i}`}
              data-m
              variants={comicPop}
              custom={personality.rotate}
              initial="hidden"
              whileInView="visible"
              viewport={viewport.early}
              className="absolute w-[34%] -translate-x-1/2 -translate-y-1/2 [left:var(--mx)] [top:var(--my)] md:w-[17%] md:[left:var(--x)] md:[top:var(--y)]"
              style={{
                ["--mx" as string]: `${MOBILE[i][0]}%`,
                ["--my" as string]: `${MOBILE[i][1]}%`,
                ["--x" as string]: `${DESKTOP[i][0]}%`,
                ["--y" as string]: `${DESKTOP[i][1]}%`,
              }}
            >
              <div className="group/photo relative border-[4px] border-mischief-ink bg-mischief-paper p-2 pb-8 text-mischief-ink shadow-[6px_6px_0_0_rgb(17_17_17)]">
                <span aria-hidden="true" className="absolute -top-3 left-1/2 z-20 block size-5 -translate-x-1/2 rounded-full border-[3px] border-mischief-ink bg-mischief-secondary" />
                <MemoryPhoto photo={photo} index={i} group={group} ratio="1 / 1" sizes="(min-width: 768px) 17vw, 34vw">
                  <ComicAnnotation kind={personality.annotation} draw="view" className="-inset-[8%] z-10 h-[116%] w-[116%]" />
                  <Sticker tone="paper" font="comic" rotate={-personality.rotate} popOnHover className="-bottom-3 -left-3 text-base">
                    {personality.stamp}
                  </Sticker>
                </MemoryPhoto>
                <p className="font-comic absolute inset-x-2 bottom-1 text-base tracking-wider">{evidenceLabel(i)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
