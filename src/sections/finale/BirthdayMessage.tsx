"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { ScrollStory } from "@/components/motion/ScrollStory";

// Quatre temps. Chaque "beat" occupe une fenêtre de progression et se superpose aux autres dans la même cellule.
const WINDOWS = [
  [0.0, 0.08, 0.2, 0.26],
  [0.26, 0.32, 0.44, 0.5],
  [0.5, 0.58, 0.74, 0.8],
  [0.8, 0.88, 1.0, 1.0],
] as const;

function Beat({ progress, window, children }: { progress: MotionValue<number>; window: readonly [number, number, number, number]; children: React.ReactNode }) {
  const [a, b, c, d] = window;
  const opacity = useTransform(progress, d === c ? [a, b] : [a, b, c, d], d === c ? [0, 1] : [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b], ["5vh", "0vh"]);
  const scale = useTransform(progress, [a, d], [0.94, 1.04]);
  return (
    <motion.div data-m className="grid place-items-center px-6 text-center" style={{ opacity, y, scale }}>
      {children}
    </motion.div>
  );
}

/** Les quatre temps du message, pilotés par une progression 0..1. */
export function BirthdayBeats({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="stack h-full">
      <Beat progress={progress} window={WINDOWS[0]}>
        <p className="display text-[clamp(5rem,26vw,36rem)] text-finale-gold">LAURA</p>
      </Beat>
      <Beat progress={progress} window={WINDOWS[1]}>
        <p className="display text-[clamp(5rem,24vw,34rem)] text-finale-ink">18 ANS</p>
      </Beat>
      <Beat progress={progress} window={WINDOWS[2]}>
        <p className="text-[clamp(2.5rem,9vw,9rem)] font-bold leading-[1.02] tracking-tight">
          Joyeux anniversaire
          <br />
          <span className="text-finale-gold">Laura.</span>
        </p>
      </Beat>
      <Beat progress={progress} window={WINDOWS[3]}>
        <p className="text-[clamp(1.75rem,5.5vw,5rem)] font-medium leading-[1.1] tracking-tight">
          Et maintenant...
          <br />
          <span className="mt-[0.4em] block text-finale-gold">
            la suite de l&apos;histoire
            <br />
            commence.
          </span>
        </p>
      </Beat>
    </div>
  );
}

/** LAURA, 18 ANS, Joyeux anniversaire Laura, puis la suite de l'histoire. Pas de phrase ajoutée. */
export function BirthdayMessage() {
  return (
    <ScrollStory
      height="420vh"
      scene="finale"
      universe="finale"
      label="Message d'anniversaire"
      stageClassName="bg-finale-background text-finale-ink"
    >
      {(progress) => <BirthdayBeats progress={progress} />}
    </ScrollStory>
  );
}
