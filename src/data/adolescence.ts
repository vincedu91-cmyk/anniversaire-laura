import { loadPhotos } from "./photos";
import type { PhotoOverrides, UniverseData } from "./types";

// Clé = nom du fichier d'origine dans photos/Adolescence.
const overrides: PhotoOverrides = {};

export const adolescence: UniverseData = {
  id: "adolescence",
  number: "02",
  label: "ADOLESCENCE",
  title: "ADOLESCENCE",
  route: "/adolescence",
  anchor: "adolescence",
  tagline: "Rapide, coloré, chaotique, social, énergique.",
  photos: loadPhotos("adolescence", overrides, 12),
};

/** Textes génériques des stickers: aucun événement réel n'est attribué à Laura. */
export const adolescenceStickers = [
  "REPLAY",
  "ON AIR",
  "STORY",
  "TAKE 2",
  "FAVORIS",
  "HD",
  "NEW",
  "LIVE",
] as const;
