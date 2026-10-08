import laura from "./laura.json";
import manifestJson from "./photos.generated.json";
import type { Photo, PhotoOverrides, UniverseId } from "./types";

interface ManifestEntry {
  file: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  year?: number;
}

type Manifest = Record<UniverseId, ManifestEntry[]> & { og: string[] };

// Fichier produit par `npm run photos` à partir du dossier photos/.
const manifest = manifestJson as unknown as Manifest;

/** Vignettes carrées pour l'image Open Graph. */
export const ogThumbs: readonly string[] = manifest.og;

const ALT_BY_UNIVERSE: Record<UniverseId, string> = {
  childhood: "Photo d'enfance de Laura",
  adolescence: "Photo de Laura adolescente",
  mischief: "Photo de Laura, souvenir de bêtises",
};

// Ratios variés pour les cadres vides, afin que les compositions restent crédibles.
const PLACEHOLDER_SIZES = [
  [1200, 1500],
  [1500, 1200],
  [1400, 1400],
  [1200, 1600],
  [1600, 1200],
  [1300, 1600],
] as const;

function slug(value: string): string {
  return value.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function placeholders(universe: UniverseId, count: number): Photo[] {
  return Array.from({ length: count }, (_, index) => {
    const [width, height] = PLACEHOLDER_SIZES[index % PLACEHOLDER_SIZES.length];
    return {
      id: `${universe}-placeholder-${index + 1}`,
      src: "",
      alt: `Emplacement photo n°${index + 1} à compléter`,
      universe,
      width,
      height,
      placeholder: true,
    };
  });
}

/**
 * Charge les photos d'un univers. Sans photo réelle, renvoie des cadres à compléter.
 * Les `overrides` enrichissent une photo (année, légende, alt, mise en avant) par nom de fichier.
 */
export function loadPhotos(
  universe: UniverseId,
  overrides: PhotoOverrides = {},
  placeholderCount = 10,
): Photo[] {
  const entries = manifest[universe];
  if (entries.length === 0) return placeholders(universe, placeholderCount);

  return entries.map((entry, index) => {
    const override = overrides[entry.file] ?? {};
    return {
      id: `${universe}-${slug(entry.file)}`,
      src: entry.src,
      alt: override.alt ?? `${ALT_BY_UNIVERSE[universe]}, souvenir n°${index + 1}`,
      year: override.year ?? entry.year,
      universe,
      caption: override.caption,
      featured: override.featured,
      editorial: override.editorial,
      width: entry.width,
      height: entry.height,
      blurDataURL: entry.blurDataURL,
    };
  });
}

/** Sélectionne `count` photos en repartant du début si la liste est plus courte (jamais de trou). */
export function pickPhotos(photos: readonly Photo[], count: number, start = 0): Photo[] {
  if (photos.length === 0) return [];
  return Array.from({ length: count }, (_, index) => photos[(start + index) % photos.length]);
}

/** Photos au-delà de celles déjà consommées par les compositions. */
export function restPhotos(photos: readonly Photo[], consumed: number): Photo[] {
  return photos.length > consumed ? photos.slice(consumed) : [];
}

/** Naissance de Laura (src/data/laura.json): sert de repère quand une photo n'a pas de date. */
export const BIRTH_YEAR: number = laura.birthYear;
export const BIRTH_LABEL = `${laura.birthMonth} ${laura.birthYear}`;

/**
 * Année affichée pour une photo: sa vraie date (EXIF, nom de fichier ou override) si elle existe,
 * sinon l'année de naissance. Renseigner `year` dans les overrides d'une photo pour la corriger.
 */
export function yearLabel(photo: Pick<Photo, "year">): string {
  return String(photo.year ?? BIRTH_YEAR);
}

/** Date du héros de l'univers Naissance: la date de la photo, sinon "Juillet 2009". */
export function birthLabel(photo: Pick<Photo, "year">): string {
  return photo.year ? String(photo.year) : BIRTH_LABEL;
}
