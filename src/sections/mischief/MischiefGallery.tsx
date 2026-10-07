"use client";

import { motion } from "motion/react";
import { evidenceLabel, personalities } from "@/data/mischief";
import type { Photo } from "@/data/types";
import { MemoryPhoto } from "@/components/media/MemoryPhoto";
import { ComicAnnotation } from "@/components/shared/ComicAnnotation";
import { Sticker } from "@/components/shared/Sticker";
import { fadeUp } from "@/motion/presets";
import { stagger, viewport } from "@/motion/tokens";
import { audio } from "@/lib/audio";

// Scrapbook: chaque preuve a sa place, sa taille et son inclinaison. Aucune grille uniforme.
const SLOTS = [
  { col: "md:[grid-column:1/span_5]", mt: "md:mt-0", ratio: "4 / 5" },
  { col: "md:[grid-column:7/span_4]", mt: "md:mt-[18dvh]", ratio: "1 / 1" },
  { col: "md:[grid-column:3/span_4]", mt: "md:-mt-[6dvh]", ratio: "3 / 4" },
  { col: "md:[grid-column:8/span_5]", mt: "md:mt-[10dvh]", ratio: "4 / 3" },
  { col: "md:[grid-column:1/span_4]", mt: "md:mt-[4dvh]", ratio: "1 / 1" },
  { col: "md:[grid-column:6/span_5]", mt: "md:-mt-[8dvh]", ratio: "4 / 5" },
] as const;

const STICKER_TONES = ["red", "blue", "green", "ink"] as const;

/** Galerie bêtises: polaroïds de preuves avec tampon, annotation au feutre et pop BD au survol. */
export function MischiefGallery({ photos, group }: { photos: readonly Photo[]; group: readonly Photo[] }) {
  return (
    <section aria-label="Les preuves" className="relative px-[6vw] py-[16dvh] md:pl-44">
      <div className="grid grid-cols-1 gap-y-20 md:grid-cols-12 md:gap-x-[3vw] md:gap-y-[10dvh]">
        {photos.map((photo, i) => {
          const personality = personalities[i % personalities.length];
          const slot = SLOTS[i % SLOTS.length];
          return (
            <motion.figure
              key={`${photo.id}-${i}`}
              data-m
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport.early}
              transition={{ delay: (i % 2) * stagger.loose }}
              className={`group/photo relative ${slot.col} ${slot.mt}`}
            >
              <div
                className="relative rotate-(--r) border-[5px] border-mischief-ink bg-mischief-paper p-3 pb-12 shadow-[8px_8px_0_0_rgb(17_17_17)] transition-transform duration-(--motion-medium) ease-(--ease-spring) hover:rotate-0 hover:scale-[1.04] motion-reduce:transition-none"
                style={{ ["--r" as string]: `${personality.rotate}deg` }}
              >
                <MemoryPhoto
                  photo={photo}
                  index={i}
                  group={group}
                  ratio={slot.ratio}
                  sizes="(min-width: 768px) 36vw, 88vw"
                  onEnter={() => audio.cue("pop")}
                >
                  <ComicAnnotation kind={personality.annotation} className="-inset-[6%] z-10 h-[112%] w-[112%]" />
                  <Sticker tone={STICKER_TONES[i % STICKER_TONES.length]} font="comic" rotate={personality.rotate * -2} popOnHover className="-right-5 -top-6">
                    {personality.stamp}
                  </Sticker>
                </MemoryPhoto>
                <figcaption className="font-comic absolute inset-x-3 bottom-2 text-xl tracking-wider">
                  {photo.caption ?? evidenceLabel(i)}
                </figcaption>
              </div>
            </motion.figure>
          );
        })}
      </div>
    </section>
  );
}
