"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, type MotionValue } from "motion/react";
import type { Photo } from "@/data/types";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { usePhotoViewer } from "@/components/media/PhotoViewer";

// Éléments graphiques de l'Univers 03 (dossier éditorial): tirage, ruban, tampon, post-it, note au stylo, flèche.
// Volontairement sobres: papier, encre, un seul accent (le rouge du tampon).

export function Tape({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`absolute z-10 block h-6 w-20 bg-laura-tape/80 shadow-[0_1px_2px_rgb(19_19_21/0.2)] ${className}`} />;
}

export function Stamp({ children, rotate = -6, className = "" }: { children: ReactNode; rotate?: number; className?: string }) {
  return (
    <span
      className={`inline-block border-[3px] border-laura-red px-3 py-1 font-mono text-[clamp(0.75rem,1.15vw,1.05rem)] font-bold uppercase leading-tight tracking-[0.16em] text-laura-red mix-blend-multiply ${className}`}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}

export function PostIt({ children, rotate = 3, className = "" }: { children: ReactNode; rotate?: number; className?: string }) {
  return (
    <span
      className={`inline-block bg-laura-postit px-4 py-3 font-scribble text-[clamp(1.5rem,2.3vw,2.2rem)] uppercase leading-none text-laura-ink shadow-[0_8px_16px_rgb(19_19_21/0.25)] ${className}`}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}

/** Note au stylo bille, à la main. */
export function Biro({ children, rotate = -2, className = "" }: { children: ReactNode; rotate?: number; className?: string }) {
  return (
    <span className={`inline-block font-scribble text-[clamp(1.6rem,2.6vw,2.6rem)] uppercase leading-[0.95] text-laura-biro ${className}`} style={{ rotate: `${rotate}deg` }}>
      {children}
    </span>
  );
}

/** Flèche dessinée à la main. Avec `draw`, elle se trace au fil de la progression. */
export function HandArrow({ draw, className = "", flip = false }: { draw?: MotionValue<number>; className?: string; flip?: boolean }) {
  const common = { fill: "none", stroke: "var(--color-laura-biro)", strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 120 80" className={`pointer-events-none absolute overflow-visible ${flip ? "-scale-x-100" : ""} ${className}`}>
      <motion.path d="M6 12 C 38 6, 84 22, 98 62" {...common} style={draw ? { pathLength: draw } : undefined} />
      <motion.path d="M80 56 L 98 64 L 104 44" {...common} style={draw ? { pathLength: draw } : undefined} />
    </svg>
  );
}

interface PrintProps {
  photo: Photo;
  index: number;
  sizes: string;
  /** Légende imprimée sous la photo (ex. PREUVE N°01). */
  label?: string;
  ratio?: string;
  rotate?: number;
  tape?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Si fourni, un clic ouvre la photo en plein écran dans ce groupe. */
  group?: readonly Photo[];
  /** Zoom du cadrage (valeur animée). */
  imageScale?: MotionValue<number>;
  children?: ReactNode;
}

/** Tirage papier: bord blanc, légende imprimée, ruban adhésif. */
export function Print({ photo, index, sizes, label, ratio, rotate = 0, tape = true, className = "", style, group, imageScale, children }: PrintProps) {
  const { open } = usePhotoViewer();
  const picture = (
    <div className="relative overflow-hidden" style={{ aspectRatio: ratio ?? `${photo.width} / ${photo.height}` }}>
      <motion.div className="h-full w-full" style={imageScale ? { scale: imageScale } : undefined}>
        <PhotoFrame photo={photo} index={index} sizes={sizes} tone="laura" />
      </motion.div>
    </div>
  );
  return (
    <div className={`relative ${className}`} style={{ rotate: `${rotate}deg`, ...style }}>
      <div className="relative bg-laura-print p-[3.5%] pb-[12%] shadow-[0_16px_34px_rgb(19_19_21/0.3),0_2px_4px_rgb(19_19_21/0.22)] [container-type:inline-size]">
        {group ? (
          <button type="button" data-cursor aria-label={`Agrandir la photo : ${photo.alt}`} onClick={() => open(photo, group)} className="block w-full text-left">
            {picture}
          </button>
        ) : (
          picture
        )}
        {label && <p className="absolute inset-x-[3.5%] bottom-[3%] font-mono text-[clamp(0.6rem,3.2cqw,0.8rem)] uppercase tracking-[0.2em] text-laura-ink/80">{label}</p>}
      </div>
      {tape && <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-2" />}
      {children}
    </div>
  );
}
