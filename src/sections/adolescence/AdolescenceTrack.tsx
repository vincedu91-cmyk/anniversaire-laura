"use client";

import { useRef, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { adolescenceStickers } from "@/data/adolescence";
import type { Photo } from "@/data/types";
import { yearLabel } from "@/data/photos";
import { MemoryPhoto } from "@/components/media/MemoryPhoto";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { Sticker } from "@/components/shared/Sticker";
import { useHorizontalTravel } from "@/motion/hooks";
import { audio } from "@/lib/audio";

type StickerTone = "magenta" | "cyan" | "fluo";
const TONES: readonly StickerTone[] = ["fluo", "magenta", "cyan"];

// Compositions chaotiques mais contrôlées: tailles, ratios, décalages et rotations qui se répondent.
const LAYOUT = [
  { w: "w-[66vw] md:w-[26vw]", ratio: "4 / 5", dy: "-4dvh", rot: -3, pull: "" },
  { w: "w-[74vw] md:w-[34vw]", ratio: "4 / 3", dy: "16dvh", rot: 4, pull: "-ml-[10vw] md:-ml-[3vw]" },
  { w: "w-[52vw] md:w-[19vw]", ratio: "1 / 1", dy: "-22dvh", rot: -7, pull: "" },
  { w: "w-[62vw] md:w-[25vw]", ratio: "3 / 4", dy: "10dvh", rot: 2, pull: "-ml-[12vw] md:-ml-[6vw]" },
  { w: "w-[82vw] md:w-[40vw]", ratio: "16 / 10", dy: "-10dvh", rot: -2, pull: "" },
  { w: "w-[56vw] md:w-[21vw]", ratio: "4 / 5", dy: "20dvh", rot: 7, pull: "-ml-[8vw] md:-ml-[2vw]" },
] as const;

function Track({ progress, travel, trackRef, photos }: { progress: MotionValue<number>; travel: number; trackRef: RefObject<HTMLDivElement | null>; photos: readonly Photo[] }) {
  const x = useTransform(progress, [0, 1], [0, -travel]);

  return (
    <div className="hscroll relative h-full overflow-hidden">
      <motion.div ref={trackRef} data-m className="flex h-full items-center gap-[7vw] pl-[8vw] pr-[24vw] md:pl-44" style={{ x }}>
        <p aria-hidden="true" className="display outline-text shrink-0 text-[clamp(10rem,34vw,40rem)] text-adolescence-secondary">
          02
        </p>
        {photos.map((photo, i) => {
          const layout = LAYOUT[i % LAYOUT.length];
          return (
            <motion.div
              key={`${photo.id}-${i}`}
              data-m
              className={`group/photo relative shrink-0 ${layout.w} ${layout.pull}`}
              style={{ marginTop: layout.dy, rotate: layout.rot }}
            >
              <MemoryPhoto
                photo={photo}
                index={i}
                group={photos}
                ratio={layout.ratio}
                tilt
                glitch
                sizes="(min-width: 768px) 40vw, 82vw"
                onEnter={() => audio.cue("pop")}
              >
                <Sticker tone={TONES[i % TONES.length]} rotate={i % 2 ? 8 : -9} popOnHover className="-right-3 -top-4 md:-right-5">
                  {adolescenceStickers[i % adolescenceStickers.length]}
                </Sticker>
                <p className="mono pointer-events-none absolute -bottom-7 left-0 text-adolescence-fluo opacity-0 transition-opacity duration-(--motion-fast) group-hover/photo:opacity-100 group-focus-within/photo:opacity-100">
                  {photo.caption ?? `${yearLabel(photo)} / ${String(i + 1).padStart(2, "0")}`}
                </p>
              </MemoryPhoto>
            </motion.div>
          );
        })}
      </motion.div>
      <div aria-hidden="true" className="absolute inset-x-4 bottom-[6dvh] h-[3px] bg-adolescence-ink/20 md:inset-x-44">
        <motion.span data-m className="block h-full origin-left bg-adolescence-primary" style={{ scaleX: progress }} />
      </div>
    </div>
  );
}

/** Galerie ado: le scroll vertical pilote un défilement horizontal (stage sticky), photos en désordre contrôlé. */
export function AdolescenceTrack({ photos }: { photos: readonly Photo[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const travel = useHorizontalTravel(trackRef);
  return (
    <ScrollStory
      height={`calc(100dvh + ${travel}px)`}
      label="Galerie d'adolescence"
      stageClassName="bg-adolescence-background"
    >
      {(progress) => <Track progress={progress} travel={travel} trackRef={trackRef} photos={photos} />}
    </ScrollStory>
  );
}
