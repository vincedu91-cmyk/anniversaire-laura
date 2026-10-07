"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { useFinePointer } from "@/motion/hooks";
import { attachPointer, pointerPxX, pointerPxY } from "@/motion/pointer";
import { spring } from "@/motion/tokens";

const RING = 28;
const HOVER_SCALE = 1.9;

/**
 * Curseur très discret: un anneau fin qui suit la souris (mix-blend difference).
 * Le curseur natif reste visible. Absent sur tactile et en mouvement réduit.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const x = useSpring(pointerPxX, spring.cursor);
  const y = useSpring(pointerPxY, spring.cursor);
  const scale = useMotionValue(1);
  const smoothScale = useSpring(scale, spring.soft);

  useEffect(() => {
    if (!fine || reduced) return;
    attachPointer();
    const onOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      scale.set(target?.closest("a, button, [data-cursor]") ? HOVER_SCALE : 1);
    };
    window.addEventListener("pointerover", onOver, { passive: true });
    return () => window.removeEventListener("pointerover", onOver);
  }, [fine, reduced, scale]);

  if (!fine || reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-(--z-cursor) rounded-full border border-white mix-blend-difference"
      style={{ x, y, scale: smoothScale, width: RING, height: RING, marginLeft: -RING / 2, marginTop: -RING / 2 }}
    />
  );
}
