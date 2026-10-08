"use client";

import { easeOut, motion, useTransform, type MotionValue } from "motion/react";
import { adolescence } from "@/data/adolescence";
import { pickPhotos } from "@/data/photos";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { audio } from "@/lib/audio";
import { useCrossing } from "@/motion/hooks";

const NEON_BARS = ["bg-adolescence-primary", "bg-adolescence-secondary", "bg-adolescence-violet", "bg-adolescence-fluo", "bg-adolescence-electric"] as const;

/**
 * Adolescence > Laura: la vitesse, un freeze frame, le disque qui se bloque, le noir, le silence...
 * puis une feuille de papier tombe: "On pourrait s'arrêter là."
 */
export function AdolescenceToLauraStage({ progress }: { progress: MotionValue<number> }) {
  const freezePhoto = pickPhotos(adolescence.photos, 1)[0];
  useCrossing(progress, 0.5, () => audio.cue("scratch"));

  const wordX = useTransform(progress, [0, 0.28], ["30vw", "-120vw"]);
  const neonOpacity = useTransform(progress, [0.2, 0.26], [1, 0]);
  const freezeOpacity = useTransform(progress, [0.25, 0.27, 0.5, 0.51], [0, 1, 1, 0]);
  const freezeScale = useTransform(progress, [0.25, 0.3], [1.4, 1]);
  const flash = useTransform(progress, [0.245, 0.255, 0.285], [0, 0.85, 0]);
  const discOpacity = useTransform(progress, [0.5, 0.505, 0.68, 0.69], [0, 1, 1, 0]);
  const disc = useTransform(progress, [0.5, 0.62, 0.64, 0.68], [0, 540, 520, 560]);
  const paperY = useTransform(progress, [0.8, 0.93], ["-100%", "0%"], { ease: easeOut });

  return (
    <>
      <div className="rm-hide absolute inset-0 overflow-hidden bg-adolescence-background">
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

        <motion.div data-m aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ opacity: discOpacity }}>
          <motion.svg data-m viewBox="-50 -50 100 100" className="size-[70vmin]" style={{ rotate: disc }}>
            {[46, 38, 30, 22].map((r) => (
              <circle key={r} r={r} fill="none" stroke="var(--color-adolescence-ink)" strokeWidth="0.6" opacity="0.7" />
            ))}
            <circle r="9" fill="var(--color-adolescence-primary)" />
            <circle r="1.4" fill="var(--color-adolescence-background)" />
          </motion.svg>
        </motion.div>

        {/* Le papier tombe: l'univers 03 commence sur une feuille blanche. */}
        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-laura-paper shadow-[0_24px_40px_rgb(0_0_0/0.35)]" style={{ y: paperY }} />
      </div>

      <div className="rm-only bg-laura-paper px-6 py-24 text-laura-ink md:pl-44">
        <p className="mono">...</p>
      </div>
    </>
  );
}

export function AdolescenceToLaura() {
  return (
    <ScrollStory height="380vh" label="Transition: freeze frame et silence" stageClassName="bg-adolescence-background">
      {(progress) => <AdolescenceToLauraStage progress={progress} />}
    </ScrollStory>
  );
}
