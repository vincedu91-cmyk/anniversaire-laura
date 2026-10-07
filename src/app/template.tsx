"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { universeTransition } from "@/motion/presets";

let booted = false;

/** Rideau de transition entre pages (pas au premier chargement, couvert par le loader). */
export default function Template({ children }: { children: ReactNode }) {
  const [animate] = useState(() => booted);
  useEffect(() => {
    booted = true;
  }, []);

  return (
    <>
      {animate && (
        <motion.div
          aria-hidden="true"
          data-m
          className="pointer-events-none fixed inset-0 z-(--z-curtain) bg-neutral-ink"
          variants={universeTransition}
          initial="initial"
          animate="animate"
        />
      )}
      {children}
    </>
  );
}
