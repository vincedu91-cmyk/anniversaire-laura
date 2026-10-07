"use client";

import { motion } from "motion/react";
import type { Photo } from "@/data/types";
import { fadeUp } from "@/motion/presets";
import { stagger, viewport } from "@/motion/tokens";
import { MemoryPhoto } from "./MemoryPhoto";

export interface MosaicCell {
  /** Colonne de départ (1-12) et nombre de colonnes. */
  col: number;
  span: number;
  /** Décalage vertical (en rem) pour casser l'alignement des rangées. */
  offset: number;
  ratio: string;
}

interface PhotoMosaicProps {
  photos: readonly Photo[];
  cells: readonly MosaicCell[];
  group?: readonly Photo[];
  startIndex?: number;
  className?: string;
}

/** Mosaïque très espacée: peu de photos, beaucoup de vide, décalages verticaux. Une colonne sur mobile. */
export function PhotoMosaic({ photos, cells, group, startIndex = 0, className = "" }: PhotoMosaicProps) {
  return (
    <div className={`grid grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-[4vw] md:gap-y-[14vh] ${className}`}>
      {photos.map((photo, i) => {
        const cell = cells[i % cells.length];
        return (
          <motion.div
            key={`${photo.id}-${i}`}
            data-m
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport.early}
            transition={{ delay: (i % 3) * stagger.loose }}
            className="md:[grid-column:var(--col)/span_var(--span)] md:[margin-top:var(--offset)]"
            style={{
              ["--col" as string]: cell.col,
              ["--span" as string]: cell.span,
              ["--offset" as string]: `${cell.offset}rem`,
            }}
          >
            <MemoryPhoto
              photo={photo}
              index={startIndex + i}
              group={group}
              ratio={cell.ratio}
              sizes="(min-width: 768px) 40vw, 90vw"
              className="w-full"
            />
          </motion.div>
        );
      })}
    </div>
  );
}
