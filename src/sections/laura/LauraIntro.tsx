"use client";

import { easeOut, motion, useTransform, type MotionValue } from "motion/react";
import { LAURA_TITLE_LINES } from "@/data/mischief";
import { ScrollStory } from "@/components/motion/ScrollStory";

// Calendrier de l'acte 1 (fractions de la scène): lent, un élément à la fois.
const FIRST_LINE = [0.02, 0.1, 0.24, 0.3] as const; // "On pourrait s'arrêter là."
const BUT = [0.32, 0.38, 0.56, 0.62] as const; // "Mais"
const DOTS = [0.4, 0.45, 0.5] as const; // les trois points de "Mais..."
const TITLE_START = 0.58;
const TITLE_STEP = 0.1;
const TITLE_DOTS = [0.93, 0.95, 0.97] as const; // les points de "QUOI..."

// Décalages de chaque ligne du titre: une phrase lancée, pas un bloc institutionnel.
const INDENTS = ["0vw", "9vw", "2vw", "15vw"] as const;

function TitleLine({ progress, index, text }: { progress: MotionValue<number>; index: number; text: string }) {
  const start = TITLE_START + index * TITLE_STEP;
  const opacity = useTransform(progress, [start, start + 0.02], [0, 1]);
  const y = useTransform(progress, [start, start + 0.07], ["7vh", "0vh"], { ease: easeOut });
  const clip = useTransform(progress, [start, start + 0.07], ["inset(0 0 100% 0)", "inset(0 0 0% 0)"], { ease: easeOut });
  const isLast = index === LAURA_TITLE_LINES.length - 1;
  const dots = useTransform(progress, (value) => TITLE_DOTS.filter((threshold) => value >= threshold).length);
  const word = isLast ? text.replace("…", "") : text;

  return (
    <motion.p
      data-m
      className={`display block text-[clamp(3.4rem,15.5vw,17rem)] leading-[0.84] ${index === 2 ? "text-laura-red" : "text-laura-ink"}`}
      style={{ opacity, y, clipPath: clip, marginLeft: INDENTS[index] }}
    >
      {word}
      {isLast && <Ellipsis count={dots} />}
    </motion.p>
  );
}

/** Les trois points de suspension apparaissent un par un. */
function Ellipsis({ count }: { count: MotionValue<number> }) {
  return (
    <span aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <Dot key={n} count={count} n={n} />
      ))}
    </span>
  );
}

function Dot({ count, n }: { count: MotionValue<number>; n: number }) {
  const opacity = useTransform(count, (value) => (value >= n ? 1 : 0));
  return (
    <motion.span data-m style={{ opacity }}>
      .
    </motion.span>
  );
}

function Stage({ progress }: { progress: MotionValue<number> }) {
  const firstOpacity = useTransform(progress, [...FIRST_LINE], [0, 1, 1, 0]);
  const firstY = useTransform(progress, [FIRST_LINE[0], FIRST_LINE[1]], ["3vh", "0vh"], { ease: easeOut });
  const butOpacity = useTransform(progress, [...BUT], [0, 1, 1, 0]);
  const dotsShown = useTransform(progress, (value) => DOTS.filter((threshold) => value >= threshold).length);
  const tag = useTransform(progress, [TITLE_START, TITLE_START + 0.04], [0, 1]);

  return (
    <>
      <div className="rm-hide absolute inset-0 bg-laura-paper text-laura-ink">
        <motion.p
          data-m
          className="absolute left-4 top-1/2 max-w-[18ch] -translate-y-1/2 text-[clamp(1.9rem,5vw,4.6rem)] font-medium leading-[1.05] tracking-tight md:left-44"
          style={{ opacity: firstOpacity, y: firstY }}
        >
          On pourrait s&apos;arrêter là.
        </motion.p>

        <motion.p
          data-m
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 font-medium tracking-tight text-[clamp(3rem,10vw,9rem)] md:left-44"
          style={{ opacity: butOpacity }}
        >
          Mais
          <Ellipsis count={dotsShown} />
        </motion.p>

        <motion.p data-m className="mono absolute left-4 top-[12dvh] md:left-44" style={{ opacity: tag }}>
          03
        </motion.p>

        <h2
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 md:pl-44"
          aria-label="Et puis il y a Laura, quoi..."
        >
          {LAURA_TITLE_LINES.map((text, index) => (
            <TitleLine key={text} progress={progress} index={index} text={text} />
          ))}
        </h2>
      </div>

      <div className="rm-only bg-laura-paper px-6 py-24 text-laura-ink md:pl-44">
        <p className="text-3xl font-medium">On pourrait s&apos;arrêter là.</p>
        <p className="mt-6 text-3xl font-medium">Mais...</p>
        <h2 className="display mt-10 text-[clamp(3rem,13vw,14rem)] leading-[0.86]">
          Et puis il y a <span className="text-laura-red">Laura</span>, quoi...
        </h2>
      </div>
    </>
  );
}

export { Stage as LauraIntroStage };

/** Acte 1: "On pourrait s'arrêter là. Mais... ET PUIS IL Y A LAURA, QUOI..." */
export function LauraIntro() {
  return (
    <ScrollStory
      id="laura"
      scene="mischief"
      universe="laura"
      height="400vh"
      label="Et puis il y a Laura, quoi"
      stageClassName="bg-laura-paper"
    >
      {(progress) => <Stage progress={progress} />}
    </ScrollStory>
  );
}
