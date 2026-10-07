"use client";

import { motionValue, type MotionValue } from "motion/react";

// Position du pointeur partagée (valeurs de mouvement, jamais d'état React).
// Un seul écouteur pour tout le site.

/** Position normalisée, de -0.5 (gauche/haut) à 0.5 (droite/bas). */
export const pointerX: MotionValue<number> = motionValue(0);
export const pointerY: MotionValue<number> = motionValue(0);
/** Position en pixels viewport. */
export const pointerPxX: MotionValue<number> = motionValue(-100);
export const pointerPxY: MotionValue<number> = motionValue(-100);

let attached = false;

export function attachPointer() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      pointerPxX.set(event.clientX);
      pointerPxY.set(event.clientY);
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    },
    { passive: true },
  );
}
