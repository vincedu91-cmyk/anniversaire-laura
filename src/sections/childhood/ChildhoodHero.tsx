"use client";

import { motion, useTransform } from "motion/react";
import { useRef } from "react";
import type { UniverseData } from "@/data/types";
import { yearLabel } from "@/data/photos";
import { MemoryPhoto } from "@/components/media/MemoryPhoto";
import { PhotoReveal } from "@/components/media/PhotoReveal";
import { KineticTitle } from "@/components/typography/KineticTitle";
import { useMouseParallax, useViewProgress } from "@/motion/hooks";
import { fadeUp } from "@/motion/presets";
import { viewport } from "@/motion/tokens";

/** Hero enfance: grande photo décentrée, LAURA qui la chevauche, année flottante, 01 NAISSANCE en bas à droite. */
export function ChildhoodHero({ universe }: { universe: UniverseData }) {
  const ref = useRef<HTMLElement>(null);
  const hero = universe.photos.find((photo) => photo.featured) ?? universe.photos[0];
  const mouse = useMouseParallax(18);
  const progress = useViewProgress(ref);
  const photoY = useTransform(progress, [0, 1], ["0vh", "10vh"]);
  const titleY = useTransform(progress, [0, 1], ["0vh", "-6vh"]);
  const noteY = useTransform(progress, [0, 1], ["0vh", "-14vh"]);

  return (
    <header
      ref={ref}
      className="relative min-h-dvh overflow-hidden"
      aria-label="01, la naissance"
    >
      <motion.div
        data-m
        className="absolute -right-[6vw] top-[10dvh] z-0 w-[78vw] md:right-[4vw] md:w-[min(52vw,68dvh)]"
        style={{ y: photoY }}
      >
        <motion.div data-m style={{ x: mouse.x, y: mouse.y }}>
          <PhotoReveal>
            <MemoryPhoto
              photo={hero}
              index={0}
              group={universe.photos}
              ratio="4 / 5"
              priority
              sizes="(min-width: 768px) 52vw, 78vw"
            />
          </PhotoReveal>
        </motion.div>
      </motion.div>

      <motion.div data-m className="pointer-events-none absolute bottom-[14dvh] left-[4vw] z-10 md:bottom-auto md:left-[8vw] md:top-[22dvh]" style={{ y: titleY }}>
        <KineticTitle
          as="p"
          text="LAURA"
          className="display text-[clamp(5.5rem,24vw,24rem)] text-childhood-ink"
        />
      </motion.div>

      <motion.p
        data-m
        aria-hidden="true"
        className="absolute left-[8vw] top-[20dvh] z-10 -rotate-6 font-hand text-[clamp(2.5rem,6vw,5rem)] leading-none text-childhood-ink/80 md:left-[12vw] md:top-[14dvh]"
        style={{ y: noteY }}
      >
        {yearLabel(hero)}
      </motion.p>

      <motion.div
        data-m
        className="absolute bottom-[6dvh] right-[6vw] z-10 text-right text-childhood-ink"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport.once}
      >
        <p className="mono">01</p>
        <p className="display text-[clamp(2rem,6vw,6rem)]">NAISSANCE</p>
        <p className="ml-auto mt-3 max-w-[26ch] font-hand text-xl leading-snug md:text-2xl">{universe.tagline}</p>
      </motion.div>
    </header>
  );
}
