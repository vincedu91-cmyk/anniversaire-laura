"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { ScrollStory } from "@/components/motion/ScrollStory";

/** Laura > Finale: le dossier gelé s'éteint, silence, obscurité, or, 18. */
export function LauraToFinaleStage({ progress }: { progress: MotionValue<number> }) {
  const dark = useTransform(progress, [0.08, 0.5], [0, 1]);
  const lineScale = useTransform(progress, [0.66, 0.82], [0, 1]);
  const glow = useTransform(progress, [0.74, 0.94], [0, 1]);
  const eighteen = useTransform(progress, [0.86, 0.97], [0, 1]);
  const eighteenY = useTransform(progress, [0.86, 0.97], ["3vh", "0vh"]);

  return (
    <>
      <div className="rm-hide absolute inset-0 bg-laura-paper">
        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-finale-background" style={{ opacity: dark }} />
        <motion.div
          data-m
          aria-hidden="true"
          className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_55%,rgb(255_210_122/0.28),transparent_55%)]"
          style={{ opacity: glow }}
        />
        <div className="absolute inset-x-0 top-1/2 grid place-items-center">
          <motion.span data-m aria-hidden="true" className="block h-px w-[70vw] origin-center bg-finale-gold" style={{ scaleX: lineScale }} />
        </div>
        <motion.p
          data-m
          aria-hidden="true"
          className="display absolute inset-x-0 top-1/2 mt-6 text-center text-[clamp(5rem,16vw,12rem)] leading-none text-finale-gold"
          style={{ opacity: eighteen, y: eighteenY }}
        >
          18
        </motion.p>
      </div>

      <div className="rm-only bg-finale-background px-6 py-24 text-finale-gold md:pl-44">
        <p className="display text-[clamp(5rem,16vw,12rem)]">18</p>
      </div>
    </>
  );
}

export function LauraToFinale() {
  return (
    <ScrollStory height="340vh" label="Transition: du silence à 18" stageClassName="bg-laura-paper">
      {(progress) => <LauraToFinaleStage progress={progress} />}
    </ScrollStory>
  );
}
