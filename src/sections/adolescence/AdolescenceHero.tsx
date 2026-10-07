"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import type { UniverseData } from "@/data/types";
import { MemoryPhoto } from "@/components/media/MemoryPhoto";
import { Sticker } from "@/components/shared/Sticker";
import { useMouseParallax, useViewProgress } from "@/motion/hooks";
import { comicPop, glitchIn } from "@/motion/presets";
import { viewport } from "@/motion/tokens";
import { audio } from "@/lib/audio";

const VELOCITY_RANGE = 3000;
const MAX_SKEW = 12;

/** Hero ado: ELLE / A / GRANDI. monumentaux, photos qui traversent les lettres, titres déformés par la vitesse de scroll. */
export function AdolescenceHero({ universe }: { universe: UniverseData }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { stiffness: 400, damping: 90 });
  const skew = useTransform(velocity, [-VELOCITY_RANGE, VELOCITY_RANGE], [MAX_SKEW, -MAX_SKEW], { clamp: true });
  const split = useTransform(velocity, [-VELOCITY_RANGE, 0, VELOCITY_RANGE], [-18, 0, 18], { clamp: true });
  const shadow = useTransform(split, (v) => `${v}px 0 0 var(--color-adolescence-primary), ${-v}px 0 0 var(--color-adolescence-secondary)`);

  const mouseNear = useMouseParallax(14);
  const mouseFar = useMouseParallax(34);
  const progress = useViewProgress(ref);
  const elleX = useTransform(progress, [0, 1], ["-4vw", "8vw"]);
  const aX = useTransform(progress, [0, 1], ["6vw", "-10vw"]);
  const grandiX = useTransform(progress, [0, 1], ["-8vw", "4vw"]);

  const [first, second, third] = universe.photos;

  return (
    <header
      ref={ref}
      aria-label="02, adolescence"
      className="relative isolate min-h-[115dvh] overflow-hidden px-4 pb-[12dvh] pt-[16dvh] md:pl-44"
    >
      <motion.div
        data-m
        variants={glitchIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewport.once}
        className="relative z-30 mb-[4dvh]"
      >
        <p className="mono text-adolescence-fluo">02</p>
        <p className="font-street text-[clamp(2rem,5vw,4.5rem)] uppercase leading-none tracking-wide text-adolescence-ink">ADOLESCENCE</p>
      </motion.div>

      <motion.p
        data-m
        aria-hidden="true"
        className="display relative z-10 ml-[2vw] text-[clamp(7rem,30vw,38rem)] text-adolescence-primary"
        style={{ x: elleX, skewX: skew }}
      >
        ELLE
      </motion.p>
      <motion.p
        data-m
        aria-hidden="true"
        className="display outline-text relative z-30 -mt-[3vw] ml-[44vw] text-[clamp(7rem,30vw,38rem)] text-adolescence-secondary"
        style={{ x: aX, skewX: skew }}
      >
        A
      </motion.p>
      <motion.p
        data-m
        aria-hidden="true"
        className="display relative z-40 -mt-[4vw] text-[clamp(5rem,24vw,32rem)] text-adolescence-ink mix-blend-difference"
        style={{ x: grandiX, skewX: skew, textShadow: shadow }}
      >
        GRANDI.
      </motion.p>
      <h2 className="sr-only">Elle a grandi.</h2>

      <motion.div data-m className="absolute right-[6vw] top-[22dvh] z-20 w-[34vw] md:right-[10vw] md:w-[17vw]" style={{ x: mouseNear.x, y: mouseNear.y }}>
        <MemoryPhoto photo={first} index={0} group={universe.photos} ratio="3 / 4" tilt glitch sizes="(min-width: 768px) 17vw, 34vw" onEnter={() => audio.cue("pop")} />
      </motion.div>
      <motion.div data-m className="absolute left-[8vw] top-[52dvh] z-20 w-[40vw] md:left-[34vw] md:top-[38dvh] md:w-[20vw]" style={{ x: mouseFar.x, y: mouseFar.y, rotate: -5 }}>
        <MemoryPhoto photo={second} index={1} group={universe.photos} ratio="4 / 3" tilt glitch sizes="(min-width: 768px) 20vw, 40vw" onEnter={() => audio.cue("pop")} />
      </motion.div>
      <motion.div data-m className="absolute bottom-[6dvh] right-[4vw] z-20 w-[36vw] md:bottom-[10dvh] md:right-[24vw] md:w-[16vw]" style={{ x: mouseNear.x, y: mouseNear.y, rotate: 6 }}>
        <MemoryPhoto photo={third} index={2} group={universe.photos} ratio="1 / 1" tilt glitch sizes="(min-width: 768px) 16vw, 36vw" onEnter={() => audio.cue("pop")} />
      </motion.div>

      <motion.span data-m variants={comicPop} custom={-8} initial="hidden" whileInView="visible" viewport={viewport.once} className="absolute left-[4vw] top-[44dvh] z-30 md:left-[14vw]">
        <Sticker tone="fluo" rotate={-8} className="relative">ONLINE</Sticker>
      </motion.span>
      <motion.span data-m variants={comicPop} custom={7} initial="hidden" whileInView="visible" viewport={viewport.once} className="absolute bottom-[18dvh] left-[40vw] z-30">
        <Sticker tone="magenta" rotate={7} className="relative">PLAY</Sticker>
      </motion.span>
    </header>
  );
}
