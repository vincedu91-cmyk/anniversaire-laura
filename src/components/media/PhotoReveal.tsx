"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { scaleReveal } from "@/motion/presets";
import { viewport } from "@/motion/tokens";

interface PhotoRevealProps {
  children: ReactNode;
  className?: string;
}

/** Révélation par ouverture de cadre (clip-path + scale) à l'entrée dans le viewport. */
export function PhotoReveal({ children, className }: PhotoRevealProps) {
  return (
    <motion.div
      data-m
      className={className}
      variants={scaleReveal}
      initial="hidden"
      whileInView="visible"
      viewport={viewport.early}
    >
      {children}
    </motion.div>
  );
}
