import { existsSync } from "node:fs";
import path from "node:path";

// Fichiers attendus dans public/film/. Rien n'est inventé: si un fichier manque,
// l'interface affiche "[À COMPLÉTER]" au lieu d'un lecteur cassé.
const FILE = {
  video: "laura-18-ans.mp4",
  poster: "poster.jpg",
  subtitles: "sous-titres-fr.vtt",
} as const;

export interface FilmTrack {
  src: string;
  lang: string;
  label: string;
}

export interface FilmAssets {
  title: string;
  stats: readonly [string, string, string];
  video: string | null;
  poster: string | null;
  tracks: FilmTrack[];
  directory: string;
}

function available(name: string): string | null {
  const absolute = path.join(process.cwd(), "public", "film", name);
  return existsSync(absolute) ? `/film/${name}` : null;
}

/** À appeler depuis un composant serveur uniquement (accès disque au build / à la requête). */
export function getFilmAssets(): FilmAssets {
  const subtitles = available(FILE.subtitles);
  return {
    title: "LAURA : 18 ANS DE SOUVENIRS",
    stats: ["10 MINUTES", "18 ANS", "1 HISTOIRE"],
    video: available(FILE.video),
    poster: available(FILE.poster),
    tracks: subtitles ? [{ src: subtitles, lang: "fr", label: "Français" }] : [],
    directory: "public/film/",
  };
}
