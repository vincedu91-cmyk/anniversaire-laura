"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { childhood } from "@/data/childhood";
import { duration, ease } from "@/motion/tokens";
import { markReady } from "@/lib/ready";

const CRITICAL_COUNT = 2;
const MAX_WAIT_MS = 3000;
const MIN_VISIBLE_MS = 700;

function preload(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * Écran de chargement très court. La progression suit les vrais assets critiques:
 * polices + premières photos d'enfance. Jamais artificiellement long.
 */
export function Loader() {
  const [done, setDone] = useState(false);
  const progress = useMotionValue(0);
  const label = useTransform(progress, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    const started = performance.now();
    const photos = childhood.photos.filter((p) => !p.placeholder).slice(0, CRITICAL_COUNT);
    const tasks: Promise<void>[] = [document.fonts.ready.then(() => undefined), ...photos.map((p) => preload(p.src))];
    let finished = 0;
    let cancelled = false;

    const tick = () => {
      finished += 1;
      animate(progress, (finished / tasks.length) * 100, { duration: duration.medium, ease: ease.out });
    };
    tasks.forEach((task) => void task.then(tick));

    const complete = () => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      window.setTimeout(() => !cancelled && setDone(true), wait);
    };
    void Promise.all(tasks).then(complete);
    const guard = window.setTimeout(() => {
      animate(progress, 100, { duration: duration.fast });
      complete();
    }, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(guard);
    };
  }, [progress]);

  useEffect(() => {
    if (done) markReady();
    document.documentElement.style.overflow = done ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [done]);

  return (
    <motion.div
      className="loader fixed inset-0 z-(--z-loader) grid place-items-center bg-neutral-ink text-neutral-background"
      initial={false}
      animate={{ clipPath: done ? "inset(0% 0% 100% 0%)" : "inset(0% 0% 0% 0%)" }}
      transition={{ duration: duration.slow, ease: ease.cinematic }}
      style={{ pointerEvents: done ? "none" : "auto" }}
      aria-hidden={done}
      role="status"
    >
      <noscript>
        <style>{".loader{display:none!important}"}</style>
      </noscript>
      <div className="px-6">
        <p className="display text-[clamp(4rem,18vw,14rem)]">
          LAURA
          <span className="block text-[0.5em] opacity-60">/ 18</span>
        </p>
        <p className="mono mt-8 flex items-center gap-4">
          <span>LOADING MEMORIES...</span>
          <motion.span aria-hidden="true">{label}</motion.span>
        </p>
      </div>
    </motion.div>
  );
}
