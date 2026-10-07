"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import type { MotionValue } from "motion/react";
import type { SceneId } from "@/data/types";
import { useSceneProgress } from "@/motion/hooks";

interface ScrollStoryProps {
  /** Hauteur de la scène (le défilement = durée du récit). Ex. "400vh". */
  height: string;
  id?: string;
  scene?: SceneId;
  /** Thème d'univers appliqué (variables --u-*). */
  universe?: string;
  className?: string;
  stageClassName?: string;
  style?: CSSProperties;
  label?: string;
  children: (progress: MotionValue<number>) => ReactNode;
}

/**
 * Scène scroll-driven: un conteneur haut + un stage collé au viewport.
 * `children` reçoit la progression 0..1. Pas de GSAP, pas de pin-spacer: du `position: sticky`.
 * En mouvement réduit, la scène s'aplatit en flux normal (voir universes.css).
 */
export function ScrollStory({ height, id, scene, universe, className = "", stageClassName = "", style, label, children }: ScrollStoryProps) {
  const ref = useRef<HTMLElement>(null);
  const progress = useSceneProgress(ref);
  return (
    <section
      ref={ref}
      id={id}
      data-scene={scene}
      data-universe={universe}
      aria-label={label}
      className={`scene ${className}`}
      style={{ height, ...style }}
    >
      <div className={`stage ${stageClassName}`}>{children(progress)}</div>
    </section>
  );
}
