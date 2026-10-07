"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { attachPointer, pointerX, pointerY } from "./pointer";
import { spring } from "./tokens";

/** Progression 0..1 d'une scène haute dont le stage est sticky (début haut > fin bas). */
export function useSceneProgress(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  return scrollYProgress;
}

/** Progression 0..1 pendant que l'élément traverse le viewport (entrée bas > sortie haut). */
export function useViewProgress(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return scrollYProgress;
}

/** Parallaxe verticale en % de la hauteur de l'élément, pilotée par le passage dans le viewport. */
export function useParallaxY(
  ref: RefObject<HTMLElement | null>,
  range: readonly [string, string] = ["-8%", "8%"],
): MotionValue<string> {
  const progress = useViewProgress(ref);
  return useTransform(progress, [0, 1], [range[0], range[1]]);
}

/** Parallaxe à la souris: renvoie x/y en pixels (ressort), amplitude = px au bord de l'écran. */
export function useMouseParallax(strength = 24) {
  useEffect(() => {
    attachPointer();
  }, []);
  const x = useSpring(useTransform(pointerX, (v) => v * strength * 2), spring.soft);
  const y = useSpring(useTransform(pointerY, (v) => v * strength * 2), spring.soft);
  return { x, y };
}

/** Distance horizontale à parcourir pour une piste plus large que le viewport. */
export function useHorizontalTravel(trackRef: RefObject<HTMLElement | null>): number {
  const [travel, setTravel] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setTravel(Math.max(0, el.scrollWidth - window.innerWidth));
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame.current);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [trackRef]);

  return travel;
}

/** Vrai si l'appareil a un pointeur fin (souris) et peut survoler. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return fine;
}

/** Déclenche `onCross` quand la progression franchit un seuil vers l'avant (pas au retour en arrière). */
export function useCrossing(progress: MotionValue<number>, threshold: number, onCross: () => void) {
  const previous = useRef(0);
  useMotionValueEvent(progress, "change", (value) => {
    if (previous.current < threshold && value >= threshold) onCross();
    previous.current = value;
  });
}
