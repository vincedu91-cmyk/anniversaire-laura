"use client";

import { motion } from "motion/react";
import { biroNotes, dossier, evidenceLabel, postits, stamps } from "@/data/mischief";
import type { Photo } from "@/data/types";
import { KineticTitle } from "@/components/typography/KineticTitle";
import { fadeUp } from "@/motion/presets";
import { stagger, viewport } from "@/motion/tokens";
import { Biro, HandArrow, PostIt, Print, Stamp } from "./kit";

// Acte 2: le calme. Quatre preuves bien rangées, quelques annotations, beaucoup de papier.
const PLACEMENTS = [
  { grid: "md:[grid-column:1/span_6]", mt: "md:mt-0", ratio: "4 / 5", rotate: -1.5 },
  { grid: "md:[grid-column:8/span_4]", mt: "md:mt-[20dvh]", ratio: "1 / 1", rotate: 2 },
  { grid: "md:[grid-column:3/span_6]", mt: "md:-mt-[6dvh]", ratio: "4 / 3", rotate: 1 },
  { grid: "md:[grid-column:9/span_3]", mt: "md:mt-[10dvh]", ratio: "3 / 4", rotate: -2.5 },
] as const;

export function LauraDossier({ photos, group }: { photos: readonly Photo[]; group: readonly Photo[] }) {
  return (
    <section
      data-scene="mischief"
      data-universe="laura"
      aria-label="Le dossier Laura"
      className="relative overflow-x-clip bg-(--u-bg) px-[6vw] pb-[18dvh] pt-[22dvh] text-(--u-ink) md:pl-44"
    >
      <header>
        <KineticTitle as="h2" text={dossier.title} className="display text-[clamp(3.2rem,11vw,11rem)] leading-[0.86]" />
        <motion.div data-m variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport.once} transition={{ delay: stagger.loose }}>
          <Biro rotate={-1.5} className="mt-5 block max-w-[22ch] normal-case">
            {dossier.subtitle}
          </Biro>
          <p className="mono mt-5 max-w-[44ch] leading-relaxed text-laura-ink/80">{dossier.aside}</p>
        </motion.div>
      </header>

      <div className="mt-[14dvh] grid grid-cols-1 gap-y-24 md:grid-cols-12 md:gap-x-[3vw] md:gap-y-[12dvh]">
        {photos.slice(0, PLACEMENTS.length).map((photo, i) => {
          const place = PLACEMENTS[i];
          return (
            <motion.figure
              key={`${photo.id}-${i}`}
              data-m
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport.early}
              className={`relative ${place.grid} ${place.mt}`}
            >
              <Print photo={photo} index={i} label={evidenceLabel(i)} ratio={place.ratio} rotate={place.rotate} group={group} sizes="(min-width: 768px) 46vw, 90vw">
                {i === 0 && <Stamp className="absolute -bottom-5 right-[-4%] bg-laura-paper/70" rotate={-7}>{stamps[0]}</Stamp>}
                {i === 1 && (
                  <>
                    <HandArrow className="-left-[32%] top-[18%] w-[30%]" />
                    <Biro className="absolute -left-[46%] top-[2%] max-w-[16ch]" rotate={-4}>{biroNotes[0]}</Biro>
                  </>
                )}
                {i === 2 && <PostIt className="absolute -right-3 -top-8 md:-right-8" rotate={4}>{postits[0]}</PostIt>}
                {i === 3 && <Stamp className="absolute -left-[12%] bottom-[14%] bg-laura-paper/70" rotate={8}>{stamps[1]}</Stamp>}
              </Print>
            </motion.figure>
          );
        })}
      </div>
    </section>
  );
}
