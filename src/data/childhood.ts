import { loadPhotos } from "./photos";
import type { PhotoOverrides, UniverseData } from "./types";

// Clé = nom du fichier d'origine dans photos/Naissance-Enfance.
// Exemple: "IMG_0042.jpg": { year: 2009, caption: "...", alt: "...", featured: true }
// Ne renseigner que des informations certaines.
const overrides: PhotoOverrides = {};

export const childhood: UniverseData = {
  id: "childhood",
  number: "01",
  label: "NAISSANCE",
  title: "LA NAISSANCE",
  route: "/naissance-enfance",
  anchor: "naissance",
  tagline: "Le monde avant qu'elle ne sache encore qu'elle allait devenir Laura.",
  photos: loadPhotos("childhood", overrides, 12),
};

/**
 * Mode éditorial: une photo immense avec son année et une citation.
 * La citation est celle donnée en exemple dans le brief, à valider ou remplacer.
 * Mettre `quote: undefined` pour la retirer.
 */
export const childhoodEditorial = {
  photoIndex: 1,
  quote: "Un petit début pour une grande histoire.",
} as const;
