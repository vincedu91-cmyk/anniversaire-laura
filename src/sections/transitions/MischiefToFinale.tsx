"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { ScrollStory } from "@/components/motion/ScrollStory";

// Confettis du chaos: [gauche %, haut %, taille px, classe de couleur, rotation, forme]
const CHAOS = [
  [6, 12, 54, "bg-mischief-secondary", 14, "rounded-none"],
  [18, 70, 36, "bg-mischief-blue", -22, "rounded-full"],
  [28, 30, 70, "bg-mischief-green", 30, "rounded-none"],
  [42, 8, 40, "bg-mischief-secondary", -8, "rounded-full"],
  [52, 76, 64, "bg-mischief-ink", 18, "rounded-none"],
  [62, 24, 44, "bg-mischief-blue", -30, "rounded-none"],
  [72, 62, 58, "bg-mischief-secondary", 10, "rounded-full"],
  [84, 14, 48, "bg-mischief-green", -14, "rounded-none"],
  [90, 52, 36, "bg-mischief-ink", 26, "rounded-full"],
  [12, 44, 30, "bg-mischief-paper", -18, "rounded-none"],
  [36, 56, 26, "bg-mischief-secondary", 22, "rounded-full"],
  [78, 86, 34, "bg-mischief-blue", -26, "rounded-none"],
] as const;

function Stage({ progress }: { progress: MotionValue<number> }) {
  const chaosOpacity = useTransform(progress, [0.12, 0.4], [1, 0]);
  const chaosScale = useTransform(progress, [0.12, 0.4], [1, 0.7]);
  const dark = useTransform(progress, [0.34, 0.6], [0, 1]);
  const lineScale = useTransform(progress, [0.74, 0.88], [0, 1]);
  const glow = useTransform(progress, [0.82, 0.96], [0, 1]);
  const eighteen = useTransform(progress, [0.9, 0.98], [0, 1]);
  const eighteenY = useTransform(progress, [0.9, 0.98], ["3vh", "0vh"]);

  return (
    <>
      <div className="rm-hide absolute inset-0 bg-mischief-background">
        <motion.div data-m aria-hidden="true" className="absolute inset-0" style={{ opacity: chaosOpacity, scale: chaosScale }}>
          {CHAOS.map(([left, top, size, tone, rotate, shape], i) => (
            <span
              key={i}
              className={`shake absolute block border-[3px] border-mischief-ink ${tone} ${shape}`}
              style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, rotate: `${rotate}deg`, ["--shake" as string]: `${4 + (i % 4) * 2}px`, animationDelay: `${i * -0.05}s` }}
            />
          ))}
        </motion.div>

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

/** Bêtises > Finale: le chaos retombe, silence, obscurité, or, 18. */
export function MischiefToFinale() {
  return (
    <ScrollStory height="400vh" label="Transition: du chaos au silence" stageClassName="bg-mischief-background">
      {(progress) => <Stage progress={progress} />}
    </ScrollStory>
  );
}
