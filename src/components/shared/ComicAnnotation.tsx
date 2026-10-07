"use client";

import { motion } from "motion/react";
import type { AnnotationKind } from "@/data/mischief";
import { duration, ease } from "@/motion/tokens";

interface ComicAnnotationProps {
  kind: AnnotationKind;
  /** "hover": se dessine au survol du parent `group/photo`. "view": se dessine à l'entrée dans le viewport. */
  draw?: "hover" | "view";
  className?: string;
  color?: string;
}

// Tracés dessinés à la main (viewBox 100x60). Jamais d'icône: ce sont des annotations au feutre.
const PATHS: Record<AnnotationKind, string> = {
  circle: "M52 4 C20 2 2 18 4 33 C6 50 40 58 68 54 C94 50 99 30 88 16 C78 4 56 3 38 7",
  arrow: "M4 50 C28 50 52 38 70 18 M70 18 L52 20 M70 18 L66 36",
  underline: "M4 40 C26 34 48 46 70 36 C80 32 90 36 96 34",
  burst: "M50 2 L58 20 L78 8 L72 28 L96 30 L76 40 L92 56 L68 50 L60 58 L50 44 L38 58 L32 46 L10 54 L22 38 L4 28 L26 24 L22 6 L40 18 Z",
};

/** Annotation au feutre rouge: cercle, flèche, soulignement ou explosion BD. */
export function ComicAnnotation({ kind, draw = "hover", className = "", color = "var(--color-mischief-secondary)" }: ComicAnnotationProps) {
  const common = {
    d: PATHS[kind],
    fill: "none",
    stroke: color,
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute overflow-visible ${className}`}
    >
      {draw === "view" ? (
        <motion.path
          {...common}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: duration.slow, ease: ease.out }}
        />
      ) : (
        <path
          {...common}
          className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--motion-medium) ease-(--ease-out) group-hover/photo:[stroke-dashoffset:0] group-focus-within/photo:[stroke-dashoffset:0] motion-reduce:[stroke-dashoffset:0]"
        />
      )}
    </svg>
  );
}
