"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { spring } from "@/motion/tokens";

/** Indicateur de progression: fine ligne en haut de l'écran. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, spring.smoothScroll);
  return (
    <motion.div
      aria-hidden="true"
      data-m
      className="fixed inset-x-0 top-0 z-(--z-nav) h-[3px] origin-left bg-(--nav-ink)"
      style={{ scaleX }}
    />
  );
}
