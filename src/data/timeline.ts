import { adolescence } from "./adolescence";
import { childhood } from "./childhood";
import { mischief } from "./mischief";
import type { Chapter, SceneId, UniverseData, UniverseId } from "./types";

export const universes: readonly UniverseData[] = [childhood, adolescence, mischief];

/** Chronologie de vie utilisée par la navigation immersive. */
export const chapters: readonly Chapter[] = universes.map(
  ({ id, number, label, title, route, anchor }) => ({ id, number, label, title, route, anchor }),
);

export const filmChapter = {
  route: "/le-film",
  anchor: "film",
  label: "LE FILM",
} as const;

export function universeById(id: UniverseId): UniverseData {
  return universes.find((universe) => universe.id === id) ?? childhood;
}

/** Univers suivant dans le parcours, ou le film après les bêtises. */
export function nextAfter(id: UniverseId): { label: string; number?: string; route: string } {
  const index = universes.findIndex((universe) => universe.id === id);
  const next = universes[index + 1];
  if (next) return { label: next.label, number: next.number, route: next.route };
  return { label: filmChapter.label, route: filmChapter.route };
}

/** Scène active selon le chemin (pages dédiées). */
export function sceneForPath(pathname: string): SceneId {
  if (pathname.startsWith(childhood.route)) return "childhood";
  if (pathname.startsWith(adolescence.route)) return "adolescence";
  if (pathname.startsWith(mischief.route)) return "mischief";
  if (pathname.startsWith(filmChapter.route)) return "film";
  return "intro";
}
