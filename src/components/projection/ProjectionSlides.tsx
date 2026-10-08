"use client";

import { easeOut, motion, useTransform, type MotionValue } from "motion/react";
import { adolescenceStickers } from "@/data/adolescence";
import { pickPhotos, yearLabel } from "@/data/photos";
import type { Photo, UniverseData } from "@/data/types";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { Sticker } from "@/components/shared/Sticker";
import { Bubbles } from "@/sections/childhood/Bubbles";

/** Part du chapitre consacrée à la carte-titre avant les photos. */
const TITLE_END = 0.12;

function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 91.7 + salt * 17.3) * 24634.6345;
  return x - Math.floor(x);
}

interface SlideProps {
  progress: MotionValue<number>;
  photo: Photo;
  index: number;
  start: number;
  end: number;
}

function TitleCard({ progress, number, label, className }: { progress: MotionValue<number>; number: string; label: string; className: string }) {
  const opacity = useTransform(progress, [0, 0.015, TITLE_END - 0.02, TITLE_END], [0, 1, 1, 0]);
  const scale = useTransform(progress, [0, TITLE_END], [0.94, 1.06]);
  return (
    <motion.div data-m className="absolute inset-0 grid place-items-center px-6 text-center" style={{ opacity, scale }}>
      <div>
        <p className="mono text-[clamp(1rem,2vw,2rem)]">{number}</p>
        <p className={className}>{label}</p>
      </div>
    </motion.div>
  );
}

function windowsFor(count: number, i: number) {
  const width = (1 - TITLE_END) / count;
  const start = TITLE_END + i * width;
  return { start, end: start + width, width };
}

// ---- Enfance: fondus lents, Ken Burns, année manuscrite

function ChildhoodSlide({ progress, photo, index, start, end }: SlideProps) {
  const fade = Math.min(0.02, (end - start) / 4);
  const opacity = useTransform(progress, [start, start + fade, end - fade, end], [0, 1, 1, 0]);
  const zoom = useTransform(progress, [start, end], [1, 1.12]);
  const left = index % 2 === 0;
  return (
    <motion.div data-m className="absolute inset-0" style={{ opacity }}>
      <div className={`absolute top-[8dvh] h-[84dvh] overflow-hidden ${left ? "left-[8vw]" : "right-[8vw]"}`} style={{ aspectRatio: "4 / 5" }}>
        <motion.div data-m className="h-full w-full" style={{ scale: zoom }}>
          <PhotoFrame photo={photo} index={index} sizes="40vw" />
        </motion.div>
      </div>
      <p aria-hidden="true" className={`absolute bottom-[12dvh] -rotate-3 font-hand text-[clamp(5rem,16vw,18rem)] leading-none text-childhood-ink/80 ${left ? "right-[8vw]" : "left-[8vw]"}`}>
        {yearLabel(photo)}
      </p>
    </motion.div>
  );
}

// ---- Adolescence: coupes sèches, énorme chiffre en contour, RGB split

function AdolescenceSlide({ progress, photo, index, start, end }: SlideProps) {
  const cut = 0.0004;
  const opacity = useTransform(progress, [start - cut, start, end - cut, end], [0, 1, 1, 0]);
  const punch = useTransform(progress, [start, start + (end - start) * 0.3], [1.22, 1], { ease: easeOut });
  const tilt = (seeded(index, 1) - 0.5) * 14;
  const wide = index % 3 === 1;
  const side = index % 2 === 0 ? "left-[10vw]" : "right-[10vw]";
  return (
    <motion.div data-m className="absolute inset-0" style={{ opacity, scale: punch }}>
      <p aria-hidden="true" className="display outline-text absolute inset-0 grid place-items-center text-[clamp(14rem,62vw,70rem)] text-adolescence-secondary/60">
        {String(index + 1).padStart(2, "0")}
      </p>
      <div
        className={`absolute top-1/2 -translate-y-1/2 overflow-hidden [filter:drop-shadow(10px_0_0_rgb(255_43_214/0.85))_drop-shadow(-10px_0_0_rgb(0_240_255/0.85))] ${side} ${wide ? "w-[52vw]" : "h-[78dvh]"}`}
        style={{ aspectRatio: wide ? "4 / 3" : "3 / 4", rotate: `${tilt}deg` }}
      >
        <PhotoFrame photo={photo} index={index} sizes="50vw" />
      </div>
      <Sticker tone={index % 2 ? "magenta" : "fluo"} rotate={index % 2 ? 7 : -8} className={`text-[clamp(1.5rem,3vw,3.5rem)]! ${index % 2 === 0 ? "bottom-[14dvh] right-[10vw]" : "left-[10vw] top-[14dvh]"}`}>
        {adolescenceStickers[index % adolescenceStickers.length]}
      </Sticker>
    </motion.div>
  );
}

const THEMES = {
  childhood: {
    bg: "bg-childhood-background text-childhood-ink",
    number: "01",
    label: "NAISSANCE",
    labelClass: "display text-[clamp(5rem,17vw,20rem)]",
    Slide: ChildhoodSlide,
  },
  adolescence: {
    bg: "bg-adolescence-background text-adolescence-ink",
    number: "02",
    label: "ADOLESCENCE",
    labelClass: "font-street text-[clamp(5rem,15vw,18rem)] uppercase leading-none tracking-wide",
    Slide: AdolescenceSlide,
  },
} as const;

interface ProjectionSlidesProps {
  /** Enfance ou adolescence: l'Univers 03 a ses propres scènes (src/sections/laura). */
  universe: UniverseData;
  count: number;
  progress: MotionValue<number>;
}

/** Diaporama d'un univers pour l'écran géant: une carte-titre puis `count` photos, au rythme du chapitre. */
export function ProjectionSlides({ universe, count, progress }: ProjectionSlidesProps) {
  const theme = THEMES[universe.id === "adolescence" ? "adolescence" : "childhood"];
  const photos = pickPhotos(universe.photos, count);
  return (
    <div className={`absolute inset-0 overflow-hidden ${theme.bg}`}>
      {universe.id === "childhood" && <Bubbles />}
      <TitleCard progress={progress} number={theme.number} label={theme.label} className={theme.labelClass} />
      {photos.map((photo, i) => {
        const { start, end } = windowsFor(count, i);
        const Slide = theme.Slide;
        return <Slide key={`${photo.id}-${i}`} progress={progress} photo={photo} index={i} start={start} end={end} />;
      })}
    </div>
  );
}
