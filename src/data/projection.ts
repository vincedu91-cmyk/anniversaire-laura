import type { SceneId, UniverseId } from "./types";

export type TransitionKey = "childhood-adolescence" | "adolescence-laura" | "laura-finale";
export type ChapterKind = "intro" | "slides" | "laura-intro" | "laura-evidence" | "transition" | "mosaic" | "message" | "guestbook" | "end";

export interface ProjectionChapter {
  id: string;
  kind: ChapterKind;
  /** Durée en secondes (le livre d'or est recalculé selon le nombre de messages). */
  seconds: number;
  /** Ambiance sonore au début du chapitre. */
  audio: SceneId;
  /** Changement d'ambiance en cours de chapitre, calé sur l'image (fraction 0..1). */
  audioSwitch?: { at: number; scene: SceneId };
  universe?: UniverseId;
  slides?: number;
  transition?: TransitionKey;
}

/**
 * Parcours chronométré du mode écran géant. Ajuster les durées ici suffit à raccourcir ou
 * allonger la projection: tout (image, ambiance sonore, effets) est calé sur ces valeurs.
 * "silence" = scène sans partition (intro): le son se coupe.
 */
export const projectionPlan: readonly ProjectionChapter[] = [
  { id: "intro", kind: "intro", seconds: 40, audio: "intro", audioSwitch: { at: 0.82, scene: "childhood" } },
  { id: "childhood", kind: "slides", universe: "childhood", slides: 8, seconds: 56, audio: "childhood" },
  { id: "t-childhood-adolescence", kind: "transition", transition: "childhood-adolescence", seconds: 26, audio: "childhood", audioSwitch: { at: 0.5, scene: "adolescence" } },
  { id: "adolescence", kind: "slides", universe: "adolescence", slides: 12, seconds: 44, audio: "adolescence" },
  // Univers 03: le silence tombe avec le papier (0.82), le dossier démarre, tout se fige à 0.9 (silence).
  { id: "t-adolescence-laura", kind: "transition", transition: "adolescence-laura", seconds: 30, audio: "adolescence", audioSwitch: { at: 0.5, scene: "intro" } },
  { id: "laura-intro", kind: "laura-intro", seconds: 36, audio: "intro", audioSwitch: { at: 0.5, scene: "mischief" } },
  { id: "laura-evidence", kind: "laura-evidence", seconds: 54, audio: "mischief", audioSwitch: { at: 0.9, scene: "intro" } },
  { id: "t-laura-finale", kind: "transition", transition: "laura-finale", seconds: 22, audio: "intro" },
  { id: "mosaic", kind: "mosaic", seconds: 40, audio: "finale" },
  { id: "message", kind: "message", seconds: 32, audio: "finale" },
  { id: "guestbook", kind: "guestbook", seconds: 0, audio: "finale" },
  { id: "end", kind: "end", seconds: 25, audio: "finale" },
];

/** Temps de lecture par message du livre d'or, et marge d'entrée. */
export const GUESTBOOK_SECONDS_PER_MESSAGE = 8;
export const GUESTBOOK_LEAD_SECONDS = 6;
export const GUESTBOOK_MAX_SECONDS = 150;

export interface TimedChapter extends ProjectionChapter {
  start: number;
}

/** Calcule les temps de début. Le livre d'or disparaît du parcours s'il n'a aucun message. */
export function buildPlan(messageCount: number): { chapters: TimedChapter[]; total: number } {
  let cursor = 0;
  const chapters: TimedChapter[] = [];
  for (const chapter of projectionPlan) {
    if (chapter.kind === "guestbook" && messageCount === 0) continue;
    const seconds =
      chapter.kind === "guestbook"
        ? Math.min(GUESTBOOK_MAX_SECONDS, GUESTBOOK_LEAD_SECONDS + messageCount * GUESTBOOK_SECONDS_PER_MESSAGE)
        : chapter.seconds;
    chapters.push({ ...chapter, seconds, start: cursor });
    cursor += seconds;
  }
  return { chapters, total: cursor };
}

export function chapterIndexAt(chapters: readonly TimedChapter[], time: number): number {
  for (let i = chapters.length - 1; i >= 0; i -= 1) {
    if (time >= chapters[i].start) return i;
  }
  return 0;
}
