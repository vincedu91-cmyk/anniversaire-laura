"use client";

import { motion, type Variants } from "motion/react";
import type { Photo } from "@/data/types";
import { MemoryStack } from "@/components/media/MemoryStack";
import { comicPop, fadeUp } from "@/motion/presets";
import { spring, stagger, viewport } from "@/motion/tokens";
import { audio } from "@/lib/audio";

const slam: Variants = {
  hidden: { scale: 2.6, opacity: 0, rotate: 5 },
  visible: { scale: 1, opacity: 1, rotate: 0, transition: { ...spring.bouncy } },
};

const lines: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: stagger.loose * 1.6, delayChildren: 0.2 } },
};

/** Hero bêtises: entrée "dossier classé" (bande, tampon, titre qui claque) puis la pile de preuves. */
export function MischiefHero({ tagline, stack }: { tagline: string; stack: readonly Photo[] }) {
  const [sub1, sub2] = tagline.split(". ");
  return (
    <header aria-label="03, les bêtises" className="relative min-h-[130dvh] overflow-hidden px-4 pb-[14dvh] pt-[14dvh] md:pl-44">
      <motion.div data-m variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport.once}>
        <p className="mono">03</p>
        <h2 className="font-comic text-[clamp(2.5rem,7vw,6rem)] leading-none tracking-wider">LES BÊTISES</h2>
        <p className="mt-3 max-w-[30ch] text-lg font-semibold leading-snug md:text-xl">
          {sub1}.<br />
          {sub2}
        </p>
      </motion.div>

      <motion.div
        data-m
        className="relative z-10 mt-[10dvh] -mx-4 -rotate-2 border-y-[6px] border-mischief-ink bg-mischief-secondary py-2 md:-ml-44"
        variants={comicPop}
        custom={-2}
        initial="hidden"
        whileInView="visible"
        viewport={viewport.once}
        onViewportEnter={() => audio.cue("boom")}
      >
        <p className="font-comic whitespace-nowrap text-center text-[clamp(3rem,13vw,11rem)] leading-none tracking-[0.12em] text-mischief-paper">
          ATTENTION
        </p>
      </motion.div>

      <div className="relative mt-[8dvh] grid items-start gap-12 md:grid-cols-12">
        <motion.div className="md:col-span-7" variants={lines} initial="hidden" whileInView="visible" viewport={viewport.once}>
          <motion.p
            data-m
            variants={slam}
            className="font-comic inline-block -rotate-6 border-[6px] border-mischief-secondary px-5 py-1 text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-wider text-mischief-secondary mix-blend-multiply"
          >
            DOSSIER CLASSÉ
          </motion.p>
          <h3 className="display mt-8 text-[clamp(3.5rem,13vw,13rem)] leading-[0.85]" aria-label="Très très compromettant">
            <motion.span data-m variants={slam} className="block" aria-hidden="true">TRÈS</motion.span>
            <motion.span data-m variants={slam} className="block" aria-hidden="true">TRÈS</motion.span>
            <motion.span data-m variants={slam} className="block text-[0.62em] text-mischief-blue" aria-hidden="true">COMPROMETTANT</motion.span>
          </h3>
        </motion.div>

        <motion.div
          data-m
          className="md:col-span-5 md:mt-[12dvh]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport.early}
        >
          <MemoryStack
            photos={stack}
            className="mx-auto w-[min(72vw,26rem)]"
            frameClassName="border-[6px] border-mischief-ink bg-mischief-paper shadow-[8px_8px_0_0_rgb(17_17_17)]"
          />
        </motion.div>
      </div>
    </header>
  );
}
