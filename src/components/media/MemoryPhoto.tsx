"use client";

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { Photo } from "@/data/types";
import { spring } from "@/motion/tokens";
import { PhotoFrame } from "./PhotoFrame";
import { usePhotoViewer } from "./PhotoViewer";

export interface MemoryPhotoProps {
  photo: Photo;
  sizes: string;
  /** Index d'affichage (teinte et numéro des cadres vides). */
  index?: number;
  /** Photos parmi lesquelles naviguer dans la visionneuse plein écran. */
  group?: readonly Photo[];
  className?: string;
  style?: CSSProperties;
  /** Ratio imposé (ex. "4 / 5"). Par défaut, celui de la photo. */
  ratio?: string;
  priority?: boolean;
  /** Inclinaison 3D qui suit le pointeur (desktop). */
  tilt?: boolean;
  /** Séparation RGB au survol (adolescence). */
  glitch?: boolean;
  /** Habillage du cadre (bordure épaisse, ombre dure...). */
  frameClassName?: string;
  /** Appelé au survol souris (ex. son ponctuel). */
  onEnter?: () => void;
  /** Éléments posés par-dessus (stickers, annotations): hors du bouton. */
  children?: ReactNode;
}

const TILT_MAX = 9;
const SPLIT =
  "group-hover/photo:[filter:drop-shadow(6px_0_0_rgb(255_43_214/0.85))_drop-shadow(-6px_0_0_rgb(0_240_255/0.85))]";

/** Photo d'un souvenir: zoom au survol, clic = plein écran, tilt et RGB split optionnels. */
export function MemoryPhoto({
  photo, sizes, index = 0, group, className = "", style, ratio, priority, tilt = false, glitch = false, frameClassName = "", onEnter, children,
}: MemoryPhotoProps) {
  const { open } = usePhotoViewer();
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), spring.tilt);
  const rotateY = useSpring(useMotionValue(0), spring.tilt);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!tilt || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * TILT_MAX * 2);
    rotateX.set(-((event.clientY - rect.top) / rect.height - 0.5) * TILT_MAX * 2);
  };
  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div
      ref={ref}
      className={`group/photo relative ${className}`}
      style={{ aspectRatio: ratio ?? `${photo.width} / ${photo.height}`, perspective: tilt ? 900 : undefined, ...style }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerEnter={(event) => event.pointerType === "mouse" && onEnter?.()}
    >
      <motion.button
        type="button"
        data-cursor
        data-m={tilt ? "" : undefined}
        aria-label={`Agrandir la photo : ${photo.alt}`}
        onClick={() => open(photo, group ?? [photo])}
        style={tilt ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        className={`relative block h-full w-full overflow-hidden text-left [container-type:inline-size] ${frameClassName} ${glitch ? `transition-[filter] duration-(--motion-fast) ${SPLIT}` : ""}`}
      >
        <PhotoFrame
          photo={photo}
          sizes={sizes}
          index={index}
          priority={priority}
          imageClassName="transition-transform duration-(--motion-slow) ease-(--ease-out) group-hover/photo:scale-[1.06] motion-reduce:transition-none"
        />
      </motion.button>
      {children}
    </div>
  );
}
