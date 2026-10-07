"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { childhood } from "@/data/childhood";
import { pickPhotos } from "@/data/photos";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { ScrollStory } from "@/components/motion/ScrollStory";

const STRIP = pickPhotos(childhood.photos, 8);

function TitleLayer({ className, style }: { className: string; style?: React.CSSProperties | Record<string, unknown> }) {
  return (
    <motion.p
      data-m
      aria-hidden="true"
      className={`display absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[clamp(3.5rem,15vw,18rem)] leading-[0.85] ${className}`}
      style={style as never}
    >
      ELLE A<br />GRANDI.
    </motion.p>
  );
}

export function ChildhoodToAdolescenceStage({ progress }: { progress: MotionValue<number> }) {
  const filterId = useId().replace(/:/g, "");
  const displacement = useRef<SVGFEDisplacementMapElement>(null);

  // Accélération quadratique: les photos défilent de plus en plus vite.
  const stripX = useTransform(progress, (v) => `${12 - 210 * v * v}vw`);
  const stripSkew = useTransform(progress, [0.2, 0.9], [0, -14]);
  const stripFilter = useTransform(progress, (v) => (v > 0.3 && v < 0.88 ? `url(#${filterId})` : "none"));

  const magenta = useTransform(progress, [0.18, 0.38], [0, 0.88]);
  const violet = useTransform(progress, [0.38, 0.58], [0, 0.9]);
  const cyan = useTransform(progress, [0.58, 0.78], [0, 0.92]);
  const night = useTransform(progress, [0.9, 0.905], [0, 1]);

  const puisOpacity = useTransform(progress, [0.04, 0.12, 0.3, 0.38], [0, 1, 1, 0]);
  const titleScale = useTransform(progress, [0.2, 0.7], [0.4, 1.12]);
  const titleOpacity = useTransform(progress, [0.2, 0.3], [0, 1]);
  const titleSkew = useTransform(progress, [0.4, 0.85], [0, -16]);
  const splitRed = useTransform(progress, [0.45, 0.88], ["0px", "-26px"]);
  const splitCyan = useTransform(progress, [0.45, 0.88], ["0px", "26px"]);
  const splitOpacity = useTransform(progress, [0.45, 0.55], [0, 0.9]);
  const glitchOpacity = useTransform(progress, [0.7, 0.74, 0.9], [0, 1, 1]);

  // Distorsion de l'image: l'intensité du déplacement suit la progression (écriture directe, sans re-render).
  useMotionValueEvent(progress, "change", (v) => {
    const intensity = v > 0.3 && v < 0.88 ? Math.min(1, (v - 0.3) / 0.4) * 70 : 0;
    displacement.current?.setAttribute("scale", String(intensity));
  });
  useEffect(() => () => displacement.current?.setAttribute("scale", "0"), []);

  return (
    <>
      <div className="rm-hide absolute inset-0 bg-childhood-background">
        <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
          <filter id={filterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="1" seed="4" result="noise" />
            <feDisplacementMap ref={displacement} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        <motion.ul
          data-m
          aria-hidden="true"
          className="absolute left-0 top-[18dvh] flex gap-[4vw] max-md:[filter:none!important]"
          style={{ x: stripX, skewX: stripSkew, filter: stripFilter }}
        >
          {STRIP.map((photo, i) => (
            <li key={i} className="aspect-[3/4] w-[44vw] shrink-0 md:w-[24vw]" style={{ rotate: `${(i % 2 ? 1 : -1) * 3}deg` }}>
              <PhotoFrame photo={photo} index={i} sizes="(min-width: 768px) 24vw, 44vw" />
            </li>
          ))}
        </motion.ul>

        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-adolescence-primary" style={{ opacity: magenta }} />
        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-adolescence-violet" style={{ opacity: violet }} />
        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-adolescence-secondary" style={{ opacity: cyan }} />

        <motion.p data-m className="mono absolute left-6 top-[14dvh] text-childhood-ink md:left-44" style={{ opacity: puisOpacity }}>
          PUIS...
        </motion.p>

        <TitleLayer className="text-adolescence-primary mix-blend-screen" style={{ x: splitRed, opacity: splitOpacity, scale: titleScale, skewX: titleSkew }} />
        <TitleLayer className="text-adolescence-secondary mix-blend-screen" style={{ x: splitCyan, opacity: splitOpacity, scale: titleScale, skewX: titleSkew }} />
        <motion.h2
          data-m
          aria-label="Puis... elle a grandi."
          className="display absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[clamp(3.5rem,15vw,18rem)] leading-[0.85] text-adolescence-ink"
          style={{ scale: titleScale, opacity: titleOpacity, skewX: titleSkew }}
        >
          <span aria-hidden="true">
            ELLE A<br />GRANDI.
          </span>
        </motion.h2>

        <motion.div data-m aria-hidden="true" className="absolute inset-0" style={{ opacity: glitchOpacity }}>
          <TitleLayer className="glitch-a text-adolescence-fluo" />
          <TitleLayer className="glitch-b text-adolescence-ink mix-blend-difference" />
        </motion.div>

        <motion.div data-m aria-hidden="true" className="absolute inset-0 bg-adolescence-background" style={{ opacity: night }} />
      </div>

      <div className="rm-only bg-childhood-primary px-6 py-24 text-childhood-ink md:pl-44">
        <p className="mono">PUIS...</p>
        <p className="display mt-6 text-[clamp(3.5rem,15vw,18rem)]">ELLE A GRANDI.</p>
      </div>
    </>
  );
}

/** Enfance > Adolescence: pastel, accélération, distorsion, RGB split, glitch, néon, coupe brutale. */
export function ChildhoodToAdolescence() {
  return (
    <ScrollStory height="380vh" label="Transition: elle a grandi" stageClassName="bg-childhood-background">
      {(progress) => <ChildhoodToAdolescenceStage progress={progress} />}
    </ScrollStory>
  );
}
