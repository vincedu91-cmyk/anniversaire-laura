"use client";

import { easeOut, motion, useMotionTemplate, useTransform, type MotionValue } from "motion/react";
import { biroNotes, dossier, evidenceLabel, postits, stamps } from "@/data/mischief";
import type { Photo } from "@/data/types";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { Biro, HandArrow, PostIt, Print, Stamp } from "./kit";

// Actes 3 à 5 en une seule scène: LES PREUVES (rythme qui accélère), CHAOS CONTRÔLÉ, puis FREEZE.
//   0.03 - 0.5   les photos arrivent de plus en plus vite, une annotation après chaque atterrissage
//   0.5  - 0.87  chaos contrôlé: tremblements, zooms de cadrage, superpositions
//   0.9          FREEZE: tout s'arrête, le dossier passe en noir et blanc, tampon, silence

type From = "left" | "right" | "top" | "bottom";

interface Slot {
  x: number; // position gauche, en % du stage
  y: number; // position haute, en % du stage
  w: number; // largeur desktop, en vw
  r: number; // inclinaison finale, en degrés
  from: From;
  zoom?: boolean; // arrive en gros plan brutal
  crop?: boolean; // le cadrage zoome après l'atterrissage
}

const SLOTS: readonly Slot[] = [
  { x: 8, y: 12, w: 24, r: -3, from: "left" },
  { x: 58, y: 8, w: 21, r: 3, from: "top" },
  { x: 33, y: 34, w: 28, r: -2, from: "right", zoom: true },
  { x: 5, y: 52, w: 19, r: 5, from: "bottom", crop: true },
  { x: 63, y: 42, w: 25, r: -6, from: "left" },
  { x: 41, y: 6, w: 17, r: 8, from: "bottom", zoom: true },
  { x: 21, y: 58, w: 27, r: -9, from: "right", crop: true },
  { x: 70, y: 62, w: 21, r: 5, from: "top", zoom: true },
  { x: 47, y: 52, w: 23, r: -4, from: "left", crop: true },
  { x: 13, y: 27, w: 32, r: 2, from: "bottom", zoom: true },
];

const ENTRY: Record<From, readonly [string, string]> = {
  left: ["-95vw", "0vh"],
  right: ["95vw", "0vh"],
  top: ["0vw", "-95vh"],
  bottom: ["0vw", "95vh"],
};

const FREEZE_AT = 0.9;

const smooth = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};
/** Intensité du chaos: monte entre 0.5 et 0.72, retombe d'un coup au freeze. */
const chaos = (value: number) => smooth(0.5, 0.72, value) * (1 - smooth(0.87, FREEZE_AT, value));
/** Les arrivées s'accélèrent: l'écart entre deux photos rétrécit. */
const startOf = (index: number) => 0.03 + 0.78 * (1 - Math.pow(1 - index / SLOTS.length, 1.7));
const durOf = (index: number) => Math.max(0.03, 0.11 - index * 0.008);

function Piece({ progress, photo, index, slot, group }: { progress: MotionValue<number>; photo: Photo; index: number; slot: Slot; group: readonly Photo[] }) {
  const start = startOf(index);
  const land = start + durOf(index);
  const [entryX, entryY] = ENTRY[slot.from];
  const spin = slot.from === "left" || slot.from === "top" ? -28 : 28;

  const baseX = useTransform(progress, [start, land], [entryX, "0vw"], { ease: easeOut });
  const baseY = useTransform(progress, [start, land], [entryY, "0vh"], { ease: easeOut });
  const shakeX = useTransform(progress, (v) => Math.sin(v * 140 + index * 1.9) * chaos(v) * 18);
  const shakeY = useTransform(progress, (v) => Math.cos(v * 120 + index * 2.3) * chaos(v) * 13);
  const x = useMotionTemplate`calc(${baseX} + ${shakeX}px)`;
  const y = useMotionTemplate`calc(${baseY} + ${shakeY}px)`;
  const baseRotate = useTransform(progress, [start, land], [slot.r + spin, slot.r], { ease: easeOut });
  const shakeRotate = useTransform(progress, (v) => Math.sin(v * 90 + index) * chaos(v) * 3.5);
  const rotate = useTransform([baseRotate, shakeRotate], ([base, shake]: number[]) => base + shake);
  const hit: [number, number] = slot.zoom ? [start, start + (land - start) * 0.55] : [start, land];
  const scale = useTransform(progress, hit, [slot.zoom ? 1.8 : 1.06, 1], { ease: easeOut });
  const opacity = useTransform(progress, [start, start + 0.004], [0, 1]);
  const crop = useTransform(progress, [land, land + 0.22], [1, slot.crop ? 1.45 : 1.04]);
  const noteOpacity = useTransform(progress, [land, land + 0.012], [0, 1]);
  const noteScale = useTransform(progress, [land, land + 0.025], [1.7, 1], { ease: easeOut });
  const draw = useTransform(progress, [land, land + 0.05], [0, 1]);

  const kind = index % 4;
  const round = index >> 2;
  const stamp = stamps[round % stamps.length];
  const biro = biroNotes[round % biroNotes.length];
  const postit = postits[round % postits.length];

  return (
    <motion.li
      data-m
      className="absolute list-none w-[min(calc(var(--w)*1.9vw),68vw)] md:w-[calc(var(--w)*1vw)]"
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, x, y, rotate, scale, opacity, ["--w" as string]: slot.w }}
    >
      <Print photo={photo} index={index} label={evidenceLabel(index)} sizes="(min-width: 768px) 30vw, 70vw" imageScale={crop} group={group}>
        <motion.span data-m className="pointer-events-none absolute inset-0" style={{ opacity: noteOpacity }}>
          {(kind === 0 || kind === 3) && (
            <motion.span data-m className="absolute -bottom-6 -right-[8%]" style={{ scale: noteScale }}>
              <Stamp rotate={-7} className="bg-laura-paper/70">{stamp}</Stamp>
            </motion.span>
          )}
          {kind === 1 && <Biro className="absolute -top-12 left-[2%] max-w-[16ch]" rotate={-4}>{biro}</Biro>}
          {kind === 2 && <PostIt className="absolute -right-4 -top-8" rotate={5}>{postit}</PostIt>}
          {(kind === 1 || kind === 3) && <HandArrow draw={draw} className="-left-[26%] top-[6%] w-[28%]" />}
        </motion.span>
      </Print>
    </motion.li>
  );
}

/** Les trois temps de la scène, pilotés par une progression 0..1 (scroll ou chronomètre). */
export function LauraEvidenceStage({ progress, photos, withTitle = false }: { progress: MotionValue<number>; photos: readonly Photo[]; withTitle?: boolean }) {
  const wordA = useTransform(progress, [0.3, 0.38], [0, 1]);
  const wordB = useTransform(progress, [0.62, 0.7], [0, 1]);
  const scribbleX = useTransform(progress, [0.45, 0.88], ["35vw", "-40vw"]);
  const scribbleOpacity = useTransform(progress, [0.45, 0.5, 0.86, 0.9], [0, 1, 1, 0]);
  const frozen = useTransform(progress, [FREEZE_AT, FREEZE_AT + 0.025], ["grayscale(0) contrast(1)", "grayscale(1) contrast(1.08)"]);
  const stampOpacity = useTransform(progress, [0.93, 0.935], [0, 1]);
  const stampScale = useTransform(progress, [0.93, 0.95], [3.2, 1], { ease: easeOut });
  const silence = useTransform(progress, [0.96, 0.975], [0, 1]);
  const titleOpacity = useTransform(progress, [0, 0.02, 0.1, 0.14], [0, 1, 1, 0]);

  return (
    <>
      <div className="rm-hide absolute inset-0 bg-laura-paper text-laura-ink">
        <motion.div data-m className="absolute inset-0" style={{ filter: frozen }}>
          <motion.p data-m aria-hidden="true" className="display absolute left-[4vw] top-[3dvh] text-[clamp(4rem,15vw,16rem)] text-laura-ink/[0.07] md:left-44" style={{ opacity: wordA }}>
            NO COMMENT.
          </motion.p>
          <motion.p data-m aria-hidden="true" className="display absolute bottom-[2dvh] right-[3vw] text-[clamp(3rem,11vw,12rem)] text-laura-ink/[0.07]" style={{ opacity: wordB }}>
            ON A LES PHOTOS.
          </motion.p>
          <motion.p data-m aria-hidden="true" className="absolute top-[46%] whitespace-nowrap font-scribble text-[clamp(4rem,12vw,11rem)] uppercase leading-none text-laura-biro/60" style={{ x: scribbleX, opacity: scribbleOpacity }}>
            Absolument normal.
          </motion.p>

          <ol aria-label="Les preuves" className="absolute inset-0 md:pl-[11rem]">
            {photos.slice(0, SLOTS.length).map((photo, index) => (
              <Piece key={`${photo.id}-${index}`} progress={progress} photo={photo} index={index} slot={SLOTS[index]} group={photos} />
            ))}
          </ol>
        </motion.div>

        {withTitle && (
          <motion.p data-m aria-hidden="true" className="display absolute left-4 top-[10dvh] text-[clamp(3rem,9vw,9rem)] md:left-44" style={{ opacity: titleOpacity }}>
            {dossier.title}
          </motion.p>
        )}

        <motion.div data-m aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center" style={{ opacity: stampOpacity }}>
          <motion.div data-m className="text-center" style={{ scale: stampScale, rotate: -9 }}>
            <Stamp rotate={0} className="border-[6px] bg-laura-paper/60 px-6 py-3 text-[clamp(1.5rem,5.6vw,5rem)] tracking-[0.08em]">DOSSIER CLASSÉ.</Stamp>
          </motion.div>
        </motion.div>
        <motion.p data-m aria-hidden="true" className="mono absolute inset-x-0 bottom-[8dvh] text-center text-laura-ink" style={{ opacity: silence }}>
          {stamps[3]}
        </motion.p>
      </div>

      <ul className="rm-only grid gap-8 bg-laura-paper px-6 py-24 text-laura-ink md:grid-cols-2 md:pl-44">
        {photos.slice(0, SLOTS.length).map((photo, index) => (
          <li key={`${photo.id}-${index}`}>
            <Print photo={photo} index={index} label={evidenceLabel(index)} sizes="(min-width: 768px) 40vw, 90vw" group={photos} />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Actes 3 à 5: les preuves, le chaos contrôlé, le freeze. */
export function LauraEvidence({ photos }: { photos: readonly Photo[] }) {
  return (
    <ScrollStory
      scene="mischief"
      universe="laura"
      height="calc(100dvh + 540dvh)"
      label="Les preuves"
      stageClassName="bg-laura-paper"
    >
      {(progress) => <LauraEvidenceStage progress={progress} photos={photos} />}
    </ScrollStory>
  );
}
