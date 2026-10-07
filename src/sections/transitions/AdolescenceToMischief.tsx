"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { adolescence } from "@/data/adolescence";
import { pickPhotos } from "@/data/photos";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { audio } from "@/lib/audio";
import { useCrossing } from "@/motion/hooks";

// Étoile à 16 pointes pour l'explosion cartoon (points déterministes, légèrement irréguliers).
const BURST = Array.from({ length: 32 }, (_, i) => {
  const angle = (i / 32) * Math.PI * 2;
  const radius = i % 2 === 0 ? 48 : 27 + ((i * 7) % 5);
  return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
}).join(" ");

const NEON_BARS = ["bg-adolescence-primary", "bg-adolescence-secondary", "bg-adolescence-violet", "bg-adolescence-fluo", "bg-adolescence-electric"] as const;

export function AdolescenceToMischiefStage({ progress }: { progress: MotionValue<number> }) {
  const freezePhoto = pickPhotos(adolescence.photos, 1)[0];

  useCrossing(progress, 0.5, () => audio.cue("scratch"));
  useCrossing(progress, 0.72, () => audio.cue("boom"));

  // 1. Néon: vitesse
  const wordX = useTransform(progress, [0, 0.28], ["30vw", "-120vw"]);
  const neonOpacity = useTransform(progress, [0.2, 0.26], [1, 0]);
  // 2. Freeze frame (un seul flash blanc, bref)
  const freezeOpacity = useTransform(progress, [0.25, 0.27, 0.5, 0.51], [0, 1, 1, 0]);
  const freezeScale = useTransform(progress, [0.25, 0.3], [1.4, 1]);
  const flash = useTransform(progress, [0.245, 0.255, 0.285], [0, 0.85, 0]);
  // 3. Record scratch
  const scratchOpacity = useTransform(progress, [0.5, 0.505, 0.7, 0.71], [0, 1, 1, 0]);
  const disc = useTransform(progress, [0.5, 0.62, 0.64, 0.7], [0, 540, 520, 600]);
  const scratchX = useTransform(progress, [0.5, 0.7], ["-6vw", "6vw"]);
  // 4. Explosion cartoon
  const burstScale = useTransform(progress, [0.7, 0.93], [0.05, 9]);
  const burstRotate = useTransform(progress, [0.7, 0.93], [-12, 8]);
  const boomOpacity = useTransform(progress, [0.72, 0.76, 0.88, 0.92], [0, 1, 1, 0]);
  const boomScale = useTransform(progress, [0.72, 0.8], [0.2, 1]);
  const paint = useTransform(progress, [0.9, 0.94], [0, 1]);

  return (
    <>
      <div className="rm-hide absolute inset-0 bg-adolescence-background">
        <motion.div data-m aria-hidden="true" className="absolute inset-0" style={{ opacity: neonOpacity }}>
          {NEON_BARS.map((bar, i) => (
            <span key={bar} className={`absolute top-0 h-full ${bar} opacity-80`} style={{ left: `${i * 20}%`, width: "20%", transform: `skewX(-12deg) scaleY(${0.35 + i * 0.13})`, transformOrigin: "bottom" }} />
          ))}
          <motion.p data-m className="display absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(10rem,46vw,60rem)] leading-none text-adolescence-ink mix-blend-difference" style={{ x: wordX }}>
            ADOLESCENCE
          </motion.p>
        </motion.div>

        <motion.div data-m aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ opacity: freezeOpacity }}>
          <motion.div data-m className="relative w-[64vw] max-w-[34rem] border-[10px] border-adolescence-ink bg-adolescence-ink pb-10 grayscale md:w-[30vw]" style={{ scale: freezeScale }}>
            <div className="aspect-[4/5]">
              <PhotoFrame photo={freezePhoto} index={0} sizes="30vw" />
            </div>
          </motion.div>
          <p className="font-street absolute bottom-[12dvh] text-[clamp(3rem,10vw,9rem)] uppercase leading-none text-adolescence-ink">STOP.</p>
        </motion.div>
        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-adolescence-ink" style={{ opacity: flash }} />

        <motion.div data-m aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ opacity: scratchOpacity }}>
          <motion.svg data-m viewBox="-50 -50 100 100" className="size-[70vmin]" style={{ rotate: disc }}>
            {[46, 38, 30, 22].map((r) => (
              <circle key={r} r={r} fill="none" stroke="var(--color-adolescence-ink)" strokeWidth="0.6" opacity="0.7" />
            ))}
            <circle r="9" fill="var(--color-adolescence-primary)" />
            <circle r="1.4" fill="var(--color-adolescence-background)" />
          </motion.svg>
          <motion.svg data-m viewBox="0 0 100 30" preserveAspectRatio="none" className="absolute h-[30vh] w-full" style={{ x: scratchX }}>
            <polyline points="0,8 18,22 30,6 46,24 60,4 78,26 100,10" fill="none" stroke="var(--color-adolescence-secondary)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          </motion.svg>
          <p className="font-comic shake absolute bottom-[14dvh] text-[clamp(3rem,10vw,9rem)] tracking-wider text-adolescence-fluo">SCRATCH !</p>
        </motion.div>

        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <motion.svg data-m viewBox="-50 -50 100 100" className="size-[34vmin]" style={{ scale: burstScale, rotate: burstRotate }}>
            <polygon points={BURST} fill="var(--color-mischief-primary)" stroke="var(--color-mischief-secondary)" strokeWidth="2.4" strokeLinejoin="round" />
          </motion.svg>
        </div>
        <motion.p data-m aria-hidden="true" className="font-comic absolute inset-0 grid place-items-center text-[clamp(5rem,22vw,22rem)] leading-none tracking-wider text-mischief-secondary" style={{ opacity: boomOpacity, scale: boomScale }}>
          BOUM !
        </motion.p>
        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-mischief-background" style={{ opacity: paint }} />
      </div>

      <div className="rm-only bg-mischief-background px-6 py-24 text-mischief-ink md:pl-44">
        <p className="font-comic text-[clamp(4rem,16vw,14rem)] leading-none">BOUM !</p>
      </div>
    </>
  );
}

/** Adolescence > Bêtises: néon, freeze frame, record scratch, explosion cartoon. */
export function AdolescenceToMischief() {
  return (
    <ScrollStory height="420vh" label="Transition: freeze frame et explosion" stageClassName="bg-adolescence-background">
      {(progress) => <AdolescenceToMischiefStage progress={progress} />}
    </ScrollStory>
  );
}
