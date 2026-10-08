import { loadPhotos } from "./photos";
import type { PhotoOverrides, UniverseData } from "./types";

// Clé = nom du fichier d'origine dans photos/Laura-le-petit-clown.
// L'identifiant interne reste "mischief" (navigation, projection, thèmes); le concept affiché est
// "ET PUIS IL Y A LAURA, QUOI..." (Univers 03).
const overrides: PhotoOverrides = {};

export const mischief: UniverseData = {
  id: "mischief",
  number: "03",
  label: "LAURA",
  title: "ET PUIS IL Y A LAURA, QUOI…",
  route: "/et-puis-il-y-a-laura",
  anchor: "laura",
  tagline: "Certaines choses ne s'expliquent pas.",
  photos: loadPhotos("mischief", overrides, 14),
};

/** Le titre, ligne par ligne: il apparaît en plusieurs temps. */
export const LAURA_TITLE_LINES = ["ET PUIS", "IL Y A", "LAURA,", "QUOI…"] as const;

export const dossier = {
  title: "LE DOSSIER LAURA",
  subtitle: "Certaines choses ne s'expliquent pas.",
  aside: "On ne sait pas toujours pourquoi. Mais on sait que c'est Laura.",
} as const;

/**
 * Micro-textes génériques: ils n'affirment jamais un événement réel.
 * Trois registres: tampon rouge, note au stylo bille, post-it.
 */
export const stamps = ["NO COMMENT.", "DOSSIER CLASSÉ.", "ON A LES PHOTOS.", "AUCUNE EXPLICATION DISPONIBLE."] as const;
export const biroNotes = ["ON NE POSERA PAS DE QUESTIONS.", "ÇA, C'ÉTAIT PRÉVISIBLE."] as const;
export const postits = ["TOUT VA BIEN.", "ABSOLUMENT NORMAL."] as const;

export function evidenceLabel(index: number): string {
  return `PREUVE N°${String(index + 1).padStart(2, "0")}`;
}
