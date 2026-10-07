"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { childhood } from "@/data/childhood";
import { pickPhotos } from "@/data/photos";
import type { Photo } from "@/data/types";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { KineticTitle } from "@/components/typography/KineticTitle";
import { useReady } from "@/lib/ready";
import { duration, ease } from "@/motion/tokens";

// Placement des trois premières photos qui apparaissent derrière la typographie.
const BEHIND = [
  { box: "left-[8vw] top-[16vh] w-[34vw] md:left-[14vw] md:w-[20vw]", ratio: "3 / 4", reveal: [0.2, 0.3], rise: ["8vh", "-16vh"] },
  { box: "right-[6vw] top-[10vh] w-[38vw] md:right-[12vw] md:w-[22vw]", ratio: "4 / 5", reveal: [0.28, 0.38], rise: ["14vh", "-8vh"] },
  { box: "left-[30vw] bottom-[8vh] w-[40vw] md:left-[42vw] md:w-[26vw]", ratio: "1 / 1", reveal: [0.36, 0.46], rise: ["4vh", "-20vh"] },
] as const;

function BehindPhoto({ progress, photo, config, index }: { progress: MotionValue<number>; photo: Photo; config: (typeof BEHIND)[number]; index: number }) {
  const clipPath = useTransform(progress, [...config.reveal], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const scale = useTransform(progress, [...config.reveal], [1.25, 1]);
  const y = useTransform(progress, [0.2, 0.9], [...config.rise]);
  return (
    <motion.div data-m aria-hidden="true" className={`absolute ${config.box}`} style={{ y, clipPath, aspectRatio: config.ratio }}>
      <motion.div data-m className="h-full w-full" style={{ scale }}>
        <PhotoFrame photo={photo} index={index} sizes="(min-width: 768px) 22vw, 40vw" />
      </motion.div>
    </motion.div>
  );
}

export function IntroStage({ progress }: { progress: MotionValue<number> }) {
  const ready = useReady();
  const photos = pickPhotos(childhood.photos, BEHIND.length);

  const labelOpacity = useTransform(progress, [0, 0.05], [1, 0]);
  const lauraY = useTransform(progress, [0.05, 0.28], ["0vh", "-34vh"]);
  const lauraScale = useTransform(progress, [0.05, 0.28], [1, 0.7]);
  const lauraOpacity = useTransform(progress, [0.08, 0.26], [1, 0]);

  const eighteenOpacity = useTransform(progress, [0.1, 0.2], [0, 1]);
  const eighteenScale = useTransform(progress, [0.1, 0.5, 0.84], [0.55, 1, 1.25]);
  const eighteenY = useTransform(progress, [0.1, 0.5], ["14vh", "0vh"]);
  const oneX = useTransform(progress, [0.6, 0.84], ["0vw", "-62vw"]);
  const oneRotate = useTransform(progress, [0.6, 0.84], [0, -10]);
  const eightX = useTransform(progress, [0.6, 0.84], ["0vw", "62vw"]);
  const eightRotate = useTransform(progress, [0.6, 0.84], [0, 12]);
  const ansOpacity = useTransform(progress, [0.22, 0.3, 0.7, 0.8], [0, 1, 1, 0]);
  const ansX = useTransform(progress, [0.3, 0.5], ["8vw", "0vw"]);

  const washA = useTransform(progress, [0.8, 0.9], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const washB = useTransform(progress, [0.86, 0.95], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const titleOpacity = useTransform(progress, [0.92, 0.98], [0, 1]);
  const titleY = useTransform(progress, [0.92, 0.98], ["6vh", "0vh"]);

  return (
    <>
      <div className="rm-hide absolute inset-0">
        {BEHIND.map((config, i) => (
          <BehindPhoto key={i} progress={progress} photo={photos[i]} config={config} index={i} />
        ))}

        <motion.div
          className="absolute left-6 top-[16vh] md:left-44"
          initial={{ opacity: 0, y: 16 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ delay: 0.2, duration: duration.slow, ease: ease.out }}
        >
          <motion.p data-m className="mono leading-relaxed" style={{ opacity: labelOpacity }}>
            UNE HISTOIRE COMMENCE
            <br />
            ICI
          </motion.p>
        </motion.div>

        <motion.div
          data-m
          className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 place-items-center px-2"
          style={{ y: lauraY, scale: lauraScale, opacity: lauraOpacity }}
        >
          <KineticTitle
            as="h1"
            text="LAURA"
            trigger="load"
            play={ready}
            delay={0.9}
            className="display text-[clamp(5rem,33vw,44rem)] leading-[0.82]"
          />
        </motion.div>

        <motion.div
          data-m
          aria-hidden="true"
          className="absolute -bottom-[6vh] left-1/2 flex -translate-x-[40%] items-end"
          style={{ opacity: eighteenOpacity, scale: eighteenScale, y: eighteenY }}
        >
          <motion.span data-m className="display block text-[clamp(18rem,62vw,80rem)] leading-[0.74]" style={{ x: oneX, rotate: oneRotate }}>
            1
          </motion.span>
          <motion.span data-m className="display block text-[clamp(18rem,62vw,80rem)] leading-[0.74]" style={{ x: eightX, rotate: eightRotate }}>
            8
          </motion.span>
        </motion.div>

        <motion.p
          data-m
          aria-hidden="true"
          className="display absolute bottom-[10vh] left-4 text-[clamp(3rem,11vw,12rem)] md:left-44"
          style={{ opacity: ansOpacity, x: ansX }}
        >
          ANS
        </motion.p>

        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-childhood-primary" style={{ clipPath: washA }} />
        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-childhood-background" style={{ clipPath: washB }} />
        <motion.div
          data-m
          className="absolute inset-x-0 bottom-0 px-6 pb-[10vh] text-childhood-ink md:pl-44"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <p className="mono">01</p>
          <p className="display text-[clamp(3.5rem,13vw,15rem)]">LA NAISSANCE</p>
        </motion.div>
      </div>

      <div className="rm-only px-6 py-24 md:pl-44">
        <p className="mono">UNE HISTOIRE COMMENCE ICI</p>
        <p className="display mt-10 text-[clamp(5rem,33vw,44rem)]">LAURA</p>
        <p className="display mt-6 text-[clamp(4rem,20vw,20rem)]">18 ANS</p>
        <p className="mono mt-16">01</p>
        <p className="display text-[clamp(3rem,13vw,15rem)]">LA NAISSANCE</p>
      </div>
    </>
  );
}

/** Accueil: presque vide, puis LAURA, puis un 18 monumental qui se décompose vers l'univers 01. */
export function HeroIntro() {
  return (
    <ScrollStory
      id="intro"
      scene="intro"
      height="520vh"
      label="Introduction"
      stageClassName="bg-neutral-background text-neutral-ink"
    >
      {(progress) => <IntroStage progress={progress} />}
    </ScrollStory>
  );
}
