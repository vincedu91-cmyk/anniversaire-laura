"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, motion, useAnimationFrame, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { adolescence } from "@/data/adolescence";
import { childhood } from "@/data/childhood";
import { fetchApprovedMessages, type GuestbookMessage } from "@/data/guestbook";
import { mischief } from "@/data/mischief";
import { pickPhotos } from "@/data/photos";
import { buildPlan, chapterIndexAt, type TimedChapter, type TransitionKey } from "@/data/projection";
import { audio } from "@/lib/audio";
import { markReady } from "@/lib/ready";
import { useCrossing } from "@/motion/hooks";
import { BirthdayBeats } from "@/sections/finale/BirthdayMessage";
import { MosaicStage } from "@/sections/finale/FinalMosaic";
import { PaperStage } from "@/sections/finale/GuestbookStack";
import { IntroStage } from "@/sections/home/HeroIntro";
import { LauraEvidenceStage } from "@/sections/laura/LauraEvidence";
import { LauraIntroStage } from "@/sections/laura/LauraIntro";
import { AdolescenceToLauraStage } from "@/sections/transitions/AdolescenceToLaura";
import { ChildhoodToAdolescenceStage } from "@/sections/transitions/ChildhoodToAdolescence";
import { LauraToFinaleStage } from "@/sections/transitions/LauraToFinale";
import { ProjectionSlides } from "./ProjectionSlides";

const UNIVERSES = { childhood, adolescence } as const;
// L'horloge suit le temps réel (donc le son): on ne borne que les très longues suspensions (onglet masqué).
const MAX_FRAME_MS = 1000;
const RESTART_GRACE_S = 3;

const TRANSITIONS: Record<TransitionKey, { Stage: (props: { progress: MotionValue<number> }) => React.JSX.Element; bg: string }> = {
  "childhood-adolescence": { Stage: ChildhoodToAdolescenceStage, bg: "bg-childhood-background" },
  "adolescence-laura": { Stage: AdolescenceToLauraStage, bg: "bg-adolescence-background" },
  "laura-finale": { Stage: LauraToFinaleStage, bg: "bg-laura-paper" },
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function ChapterView({ chapter, clock, messages }: { chapter: TimedChapter; clock: MotionValue<number>; messages: readonly GuestbookMessage[] }) {
  const progress = useTransform(clock, (time) => clamp01((time - chapter.start) / chapter.seconds));
  const switchAt = chapter.audioSwitch;
  useCrossing(progress, switchAt?.at ?? 2, () => switchAt && audio.setScene(switchAt.scene));

  switch (chapter.kind) {
    case "intro":
      return (
        <div className="absolute inset-0 overflow-hidden bg-neutral-background text-neutral-ink">
          <IntroStage progress={progress} />
        </div>
      );
    case "slides":
      return <ProjectionSlides universe={UNIVERSES[chapter.universe === "adolescence" ? "adolescence" : "childhood"]} count={chapter.slides ?? 8} progress={progress} />;
    case "laura-intro":
      return (
        <div className="absolute inset-0 overflow-hidden bg-laura-paper text-laura-ink">
          <LauraIntroStage progress={progress} />
        </div>
      );
    case "laura-evidence":
      return (
        <div className="absolute inset-0 overflow-hidden bg-laura-paper text-laura-ink">
          <LauraEvidenceStage progress={progress} photos={pickPhotos(mischief.photos, 10, 4)} withTitle />
        </div>
      );
    case "transition": {
      const { Stage, bg } = TRANSITIONS[chapter.transition ?? "childhood-adolescence"];
      return (
        <div className={`absolute inset-0 overflow-hidden ${bg}`}>
          <Stage progress={progress} />
        </div>
      );
    }
    case "mosaic":
      return (
        <div className="absolute inset-0 overflow-hidden bg-finale-background text-finale-ink">
          <MosaicStage progress={progress} interactive={false} />
        </div>
      );
    case "message":
      return (
        <div className="absolute inset-0 overflow-hidden bg-finale-background text-finale-ink">
          <BirthdayBeats progress={progress} />
        </div>
      );
    case "guestbook":
      return (
        <div className="absolute inset-0 overflow-hidden bg-finale-background text-finale-ink">
          <PaperStage progress={progress} messages={messages} />
        </div>
      );
    default:
      return (
        <div className="absolute inset-0 grid place-items-center overflow-hidden bg-finale-background text-center text-finale-gold">
          <div>
            <p className="display text-[clamp(8rem,34vw,44rem)]">18</p>
            <p className="mono text-finale-ink/70">R POUR RECOMMENCER</p>
          </div>
        </div>
      );
  }
}

type Phase = "gate" | "playing" | "paused";

/**
 * Mode écran géant: le parcours se joue seul, chronométré, sans souris.
 * Les scènes sont les mêmes que sur le site, pilotées par une horloge au lieu du scroll.
 * Clavier: Entrée (lancer), Espace (pause), flèches (chapitre), F (plein écran), M (son), R (recommencer).
 */
export function ProjectionPlayer() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const { chapters, total } = useMemo(() => buildPlan(messages.length), [messages.length]);
  const clock = useMotionValue(0);
  const barScale = useTransform(clock, (time) => (total > 0 ? clamp01(time / total) : 0));
  const [phase, setPhase] = useState<Phase>("gate");
  const [index, setIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const phaseRef = useRef<Phase>("gate");
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // Prépare la page: signal "chargé" pour l'intro, mode projection (animations jamais neutralisées).
  useEffect(() => {
    document.documentElement.dataset.projection = "";
    document.documentElement.style.overflow = "hidden"; // aucune barre ni défilement parasite pendant la projection
    void document.fonts.ready.then(markReady);
    let cancelled = false;
    void fetchApprovedMessages().then((result) => {
      if (!cancelled && result.ok) setMessages(result.data);
    });
    return () => {
      cancelled = true;
      delete document.documentElement.dataset.projection;
      document.documentElement.style.overflow = "";
      audio.disable();
      void wakeLock.current?.release();
    };
  }, []);

  useAnimationFrame((_, delta) => {
    if (phaseRef.current !== "playing") return;
    const next = Math.min(total, clock.get() + Math.min(delta, MAX_FRAME_MS) / 1000);
    clock.set(next);
    const at = chapterIndexAt(chapters, next);
    setIndex((current) => (current === at ? current : at));
  });

  const chapter = chapters[Math.min(index, chapters.length - 1)];
  useEffect(() => {
    if (phase !== "gate") audio.setScene(chapter.audio);
  }, [chapter.audio, chapter.id, phase]);

  const seekTo = useCallback(
    (target: number) => {
      const bounded = Math.min(chapters.length - 1, Math.max(0, target));
      clock.set(chapters[bounded].start + 0.001);
      setIndex(bounded);
    },
    [chapters, clock],
  );

  const toggleSound = useCallback(async () => {
    if (audio.isEnabled()) {
      audio.disable();
      setSoundOn(false);
    } else {
      await audio.enable();
      setSoundOn(true);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }, []);

  // Plein écran, veille et son sont des "plus": la projection démarre même si l'un d'eux est refusé.
  const start = useCallback(() => {
    try {
      void document.documentElement.requestFullscreen?.()?.catch(() => undefined);
    } catch {
      // plein écran indisponible: la projection continue en fenêtre
    }
    void navigator.wakeLock
      ?.request("screen")
      .then((lock) => {
        wakeLock.current = lock;
      })
      .catch(() => undefined);
    void audio
      .enable()
      .then(() => setSoundOn(true))
      .catch(() => setSoundOn(false));
    // ?t=75 démarre à 75 s (répétition générale, ou reprise après un incident).
    const requested = Number(new URLSearchParams(window.location.search).get("t"));
    const from = Number.isFinite(requested) ? Math.min(Math.max(0, requested), total) : 0;
    clock.set(from);
    setIndex(chapterIndexAt(chapters, from));
    changePhase("playing");
  }, [changePhase, chapters, clock, total]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") {
      changePhase("paused");
      if (audio.isEnabled()) audio.disable();
    } else if (phaseRef.current === "paused") {
      changePhase("playing");
      if (soundOn) void audio.enable();
    }
  }, [changePhase, soundOn]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (phaseRef.current === "gate") {
        if (key === "enter" || key === " ") {
          event.preventDefault();
          start();
        }
        return;
      }
      if (key === " " || key === "k") togglePause();
      else if (key === "arrowright") seekTo(index + 1);
      else if (key === "arrowleft") seekTo(clock.get() - chapter.start > RESTART_GRACE_S ? index : index - 1);
      else if (key === "f") toggleFullscreen();
      else if (key === "m") void toggleSound();
      else if (key === "r") seekTo(0);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chapter.start, clock, index, seekTo, start, toggleFullscreen, togglePause, toggleSound]);

  return (
    <MotionConfig reducedMotion="never">
      <div className={`fixed inset-0 bg-neutral-ink ${phase === "gate" ? "" : "cursor-none"}`} data-scene="intro">
        {phase !== "gate" && <ChapterView key={chapter.id} chapter={chapter} clock={clock} messages={messages} />}

        {phase === "gate" && (
          <div className="absolute inset-0 grid place-items-center bg-neutral-background px-6 text-center text-neutral-ink">
            <div>
              <h1 className="display text-[clamp(5rem,22vw,26rem)]">LAURA</h1>
              <p className="display text-[clamp(2.5rem,9vw,10rem)]">18 ANS</p>
              <button
                type="button"
                autoFocus
                onClick={start}
                className="mono mt-12 bg-neutral-ink px-8 py-4 text-neutral-background transition-transform duration-(--motion-fast) active:scale-[0.97]"
              >
                LANCER LA PROJECTION (ENTRÉE)
              </button>
              <p className="mono mt-8 max-w-[60ch] leading-relaxed opacity-80">
                ESPACE: PAUSE / FLÈCHES: CHAPITRE / F: PLEIN ÉCRAN / M: SON / R: RECOMMENCER
              </p>
            </div>
          </div>
        )}

        {phase === "paused" && (
          <div role="status" className="absolute inset-0 grid place-items-center bg-black/55 text-center text-white">
            <div>
              <p className="display text-[clamp(4rem,14vw,16rem)]">PAUSE</p>
              <p className="mono mt-4">ESPACE POUR REPRENDRE</p>
            </div>
          </div>
        )}

        {phase !== "gate" && (
          <motion.div
            aria-hidden="true"
            data-m
            className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-finale-gold/60"
            style={{ scaleX: barScale }}
          />
        )}
      </div>
    </MotionConfig>
  );
}
