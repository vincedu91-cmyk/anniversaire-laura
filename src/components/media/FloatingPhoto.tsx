"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useTransform } from "motion/react";
import { useViewProgress } from "@/motion/hooks";
import { photoFloat } from "@/motion/presets";
import { MemoryPhoto, type MemoryPhotoProps } from "./MemoryPhoto";

interface FloatingPhotoProps extends MemoryPhotoProps {
  /** Amplitude de parallaxe au scroll, en px (profondeur: plus c'est grand, plus c'est "proche"). */
  depth?: number;
  /** Amplitude du flottement lent, en px. 0 = immobile. */
  float?: number;
  delay?: number;
  rotate?: number;
  /** Classes de placement du conteneur (position, largeur). */
  wrapperClassName?: string;
}

/** Photo qui flotte doucement et se déplace à une vitesse différente du scroll (profondeur). */
export function FloatingPhoto({
  depth = 60, float = 10, delay = 0, rotate = 0, wrapperClassName = "", ...photoProps
}: FloatingPhotoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const progress = useViewProgress(ref);
  const y = useTransform(progress, [0, 1], [depth, -depth]);
  const idle = photoFloat(float, 7 + delay, delay);

  return (
    <motion.div ref={ref} data-m className={wrapperClassName} style={{ y, rotate }}>
      <motion.div
        data-m
        animate={reduced || float === 0 ? undefined : idle.animate}
        transition={idle.transition}
      >
        <MemoryPhoto {...photoProps} />
      </motion.div>
    </motion.div>
  );
}
