import type { Transition, Variants } from "motion/react";
import { duration, ease, spring, stagger } from "./tokens";

/** Montée douce: la brique de base de toute apparition. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
};

/** Révélation d'image: un cadre qui s'ouvre et se pose. */
export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 1.18, clipPath: "inset(14% 14% 14% 14%)" },
  visible: {
    opacity: 1,
    scale: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { duration: duration.cinematic, ease: ease.cinematic },
  },
};

/** Flottement lent (enfance). À appliquer via la prop `animate`. */
export function photoFloat(amplitude = 10, seconds = 7, delay = 0) {
  return {
    animate: {
      y: [0, -amplitude, 0],
      rotate: [0, amplitude / 6, 0],
    },
    transition: {
      duration: seconds,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    } satisfies Transition,
  };
}

/** Parallaxe d'image: amplitude en pourcentage de la hauteur du cadre. */
export const imageParallax = { range: ["-8%", "8%"] as const };

/** Découpage de texte: conteneur + enfants (lettres ou mots) montant d'un masque. */
export const textSplit = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: stagger.tight, delayChildren: 0.05 } },
  } satisfies Variants,
  item: {
    hidden: { y: "112%", rotate: 4 },
    visible: {
      y: "0%",
      rotate: 0,
      transition: { duration: duration.slow, ease: ease.out },
    },
  } satisfies Variants,
};

/** Entrée glitchée (adolescence). */
export const glitchIn: Variants = {
  hidden: { opacity: 0, x: -28, skewX: 14, clipPath: "inset(0 0 100% 0)" },
  visible: {
    opacity: [0, 1, 0.4, 1],
    x: [-28, 12, -6, 0],
    skewX: [14, -8, 3, 0],
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: duration.medium, ease: ease.out, times: [0, 0.4, 0.7, 1] },
  },
};

/** Impact cartoon (bêtises): apparition élastique avec rotation. */
export const comicPop: Variants = {
  hidden: { scale: 0, rotate: -18, opacity: 0 },
  visible: (custom: number = 0) => ({
    scale: 1,
    rotate: custom,
    opacity: 1,
    transition: { ...spring.bouncy },
  }),
};

/** Assemblage de mosaïque: voir MosaicTile pour la version pilotée par le scroll. */
export const mosaicAssemble = {
  appearSpan: 0.05,
  assembleStart: 0.5,
  assembleSpan: 0.22,
};

/** Transition de page / d'univers: rideau qui se retire vers le haut. */
export const universeTransition: Variants = {
  initial: { clipPath: "inset(0% 0% 0% 0%)" },
  animate: {
    clipPath: "inset(0% 0% 100% 0%)",
    transition: { duration: duration.slow, ease: ease.cinematic },
  },
};
