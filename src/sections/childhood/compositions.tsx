"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Photo } from "@/data/types";
import { yearLabel } from "@/data/photos";
import { FloatingPhoto } from "@/components/media/FloatingPhoto";
import { MemoryPhoto } from "@/components/media/MemoryPhoto";
import { PhotoMosaic, type MosaicCell } from "@/components/media/PhotoMosaic";
import { PhotoReveal } from "@/components/media/PhotoReveal";
import { fadeUp } from "@/motion/presets";
import { viewport } from "@/motion/tokens";

interface CompositionProps {
  group: readonly Photo[];
}

// A. Photo immense, déborde à gauche, année + citation éditoriale optionnelle.
export function CompositionImmense({ photo, group, index, quote }: CompositionProps & { photo: Photo; index: number; quote?: string }) {
  return (
    <section className="relative min-h-[130dvh] py-[16dvh]">
      <p aria-hidden="true" className="absolute right-[6vw] top-[6dvh] font-hand text-[clamp(5rem,16vw,15rem)] leading-none text-childhood-ink/80">
        {yearLabel(photo)}
      </p>
      <FloatingPhoto
        photo={photo}
        index={index}
        group={group}
        depth={36}
        float={0}
        ratio="4 / 3"
        sizes="(min-width: 768px) 88vw, 100vw"
        wrapperClassName="relative -ml-[6vw] mt-[14dvh] w-[100vw] md:w-[88vw]"
      />
      {quote && (
        <motion.p
          data-m
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport.early}
          className="relative z-10 -mt-12 ml-auto mr-[6vw] max-w-[16ch] font-hand text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] text-childhood-ink md:-mt-24"
        >
          {quote}
        </motion.p>
      )}
    </section>
  );
}

// B. Une grande photo, deux petites qui flottent autour à des profondeurs différentes.
export function CompositionOrbit({ photos, group, startIndex }: CompositionProps & { photos: readonly Photo[]; startIndex: number }) {
  return (
    <section className="relative min-h-[150dvh] py-[16dvh]">
      <FloatingPhoto
        photo={photos[0]}
        index={startIndex}
        group={group}
        depth={30}
        float={8}
        ratio="5 / 4"
        sizes="(min-width: 768px) 46vw, 66vw"
        wrapperClassName="relative ml-[24vw] mt-[18dvh] w-[66vw] md:ml-[34vw] md:w-[46vw]"
      />
      <FloatingPhoto
        photo={photos[1]}
        index={startIndex + 1}
        group={group}
        depth={120}
        float={14}
        delay={1.2}
        rotate={-5}
        ratio="3 / 4"
        sizes="(min-width: 768px) 18vw, 34vw"
        wrapperClassName="absolute left-[5vw] top-[12dvh] w-[34vw] md:left-[12vw] md:w-[16vw]"
      />
      <FloatingPhoto
        photo={photos[2]}
        index={startIndex + 2}
        group={group}
        depth={90}
        float={12}
        delay={2.4}
        rotate={4}
        ratio="1 / 1"
        sizes="(min-width: 768px) 20vw, 38vw"
        wrapperClassName="absolute bottom-[10dvh] right-[4vw] w-[38vw] md:right-[10vw] md:w-[18vw]"
      />
    </section>
  );
}

// C. Photo verticale qui traverse la zone de contenu (grande amplitude de parallaxe).
export function CompositionVertical({ photo, group, index }: CompositionProps & { photo: Photo; index: number }) {
  return (
    <section className="relative min-h-[170dvh]">
      <p aria-hidden="true" className="outline-text absolute left-[6vw] top-[40dvh] font-hand text-[clamp(4rem,14vw,13rem)] leading-none text-childhood-ink md:left-[14vw]">
        {yearLabel(photo)}
      </p>
      <FloatingPhoto
        photo={photo}
        index={index}
        group={group}
        depth={170}
        float={0}
        ratio="2 / 3"
        sizes="(min-width: 768px) 28vw, 60vw"
        wrapperClassName="absolute right-[8vw] top-[-8dvh] z-10 w-[60vw] md:right-[18vw] md:w-[28vw]"
      />
      {photo.caption && (
        <p className="absolute bottom-[14dvh] left-[6vw] max-w-[22ch] font-hand text-2xl md:left-[14vw] md:text-3xl">{photo.caption}</p>
      )}
    </section>
  );
}

const BLOBS = [
  "M0.5,0.02 C0.78,0 0.98,0.2 0.98,0.5 C0.98,0.8 0.76,1 0.48,0.98 C0.2,0.96 0.02,0.78 0.02,0.5 C0.02,0.22 0.22,0.04 0.5,0.02 Z",
  "M0.46,0.04 C0.74,0.02 0.96,0.26 0.94,0.52 C0.92,0.8 0.7,0.98 0.44,0.96 C0.18,0.94 0.04,0.74 0.06,0.46 C0.08,0.22 0.24,0.06 0.46,0.04 Z",
  "M0.54,0 C0.82,0.06 1,0.3 0.96,0.56 C0.92,0.84 0.7,1 0.42,0.96 C0.16,0.92 0,0.72 0.04,0.44 C0.08,0.2 0.28,-0.04 0.54,0 Z",
] as const;

// D. Photo dans une forme organique qui respire lentement.
export function CompositionOrganic({ photo, group, index }: CompositionProps & { photo: Photo; index: number }) {
  const reduced = useReducedMotion();
  const clipId = useId().replace(/:/g, "");
  return (
    <section className="relative min-h-[140dvh] py-[18dvh]">
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <motion.path
              d={BLOBS[0]}
              animate={reduced ? undefined : { d: [BLOBS[0], BLOBS[1], BLOBS[2], BLOBS[0]] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          </clipPath>
        </defs>
      </svg>
      <div className="relative ml-[8vw] w-[80vw] md:ml-[22vw] md:w-[40vw]">
        <div
          aria-hidden="true"
          className="absolute -right-[10%] -top-[8%] h-full w-full bg-childhood-lavender"
          style={{ clipPath: `url(#${clipId})` }}
        />
        <PhotoReveal className="relative">
          <div style={{ clipPath: `url(#${clipId})` }}>
            <MemoryPhoto photo={photo} index={index} group={group} ratio="1 / 1" sizes="(min-width: 768px) 40vw, 80vw" />
          </div>
        </PhotoReveal>
      </div>
      <p aria-hidden="true" className="absolute bottom-[12dvh] right-[8vw] -rotate-3 font-hand text-[clamp(2.5rem,7vw,6rem)] leading-none text-childhood-ink/80">
        {yearLabel(photo)}
      </p>
    </section>
  );
}

const MOSAIC_CELLS: readonly MosaicCell[] = [
  { col: 1, span: 4, offset: 0, ratio: "3 / 4" },
  { col: 7, span: 3, offset: 10, ratio: "1 / 1" },
  { col: 10, span: 3, offset: -4, ratio: "4 / 5" },
  { col: 3, span: 3, offset: 6, ratio: "4 / 3" },
  { col: 8, span: 4, offset: 2, ratio: "3 / 4" },
];

// E. Mosaïque très espacée: reçoit toutes les photos restantes.
export function CompositionMosaic({ photos, group, startIndex }: CompositionProps & { photos: readonly Photo[]; startIndex: number }) {
  return (
    <section className="relative px-[6vw] py-[20dvh] md:pl-[12vw]">
      <PhotoMosaic photos={photos} cells={MOSAIC_CELLS} group={group} startIndex={startIndex} />
    </section>
  );
}
