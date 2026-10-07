"use client";

import { motion } from "motion/react";
import { spring } from "@/motion/tokens";

/** Marqueur de la chronologie: un trait animé qui glisse d'un univers à l'autre (layoutId). */
export function UniverseIndicator({ active }: { active: boolean }) {
  return (
    <span aria-hidden="true" className="relative block h-px w-6 bg-current opacity-40 max-md:hidden">
      {active && (
        <motion.span
          layoutId="universe-indicator"
          transition={spring.snappy}
          className="absolute -top-px left-0 h-[3px] w-10 bg-current opacity-100"
        />
      )}
    </span>
  );
}
