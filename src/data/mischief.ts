import { loadPhotos } from "./photos";
import type { PhotoOverrides, UniverseData } from "./types";

// Clé = nom du fichier d'origine dans photos/Laura-le-petit-clown.
const overrides: PhotoOverrides = {};

export const mischief: UniverseData = {
  id: "mischief",
  number: "03",
  label: "BÊTISES",
  title: "LES BÊTISES",
  route: "/les-betises",
  anchor: "betises",
  tagline: "Certaines preuves auraient dû disparaître. Heureusement, non.",
  photos: loadPhotos("mischief", overrides, 14),
};

export type AnnotationKind = "circle" | "arrow" | "underline" | "burst";

export interface Personality {
  stamp: string;
  annotation: AnnotationKind;
  rotate: number;
}

/** Une "personnalité" par photo, en rotation. Textes génériques uniquement. */
export const personalities: readonly Personality[] = [
  { stamp: "NO COMMENT.", annotation: "circle", rotate: -4 },
  { stamp: "ON ÉTAIT PRÉVENUS.", annotation: "arrow", rotate: 3 },
  { stamp: "ÇA SENTAIT MAL.", annotation: "underline", rotate: -2 },
  { stamp: "DOSSIER CLASSÉ.", annotation: "burst", rotate: 5 },
];

export function evidenceLabel(index: number): string {
  return `PREUVE N°${String(index + 1).padStart(2, "0")}`;
}
