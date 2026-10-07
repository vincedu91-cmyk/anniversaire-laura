export type UniverseId = "childhood" | "adolescence" | "mischief";
export type SceneId = "intro" | UniverseId | "finale" | "film";

export interface Photo {
  id: string;
  src: string;
  alt: string;
  year?: number;
  universe: UniverseId;
  caption?: string;
  featured?: boolean;
  /** Dimensions intrinsèques (évite le layout shift). */
  width: number;
  height: number;
  blurDataURL?: string;
  /** Vrai quand aucune vraie photo n'est disponible: un cadre "[PHOTO À AJOUTER]" est affiché. */
  placeholder?: boolean;
  /** Mode éditorial: année + image immense + citation fournie. */
  editorial?: { quote?: string };
}

export type PhotoOverride = Partial<
  Pick<Photo, "alt" | "year" | "caption" | "featured" | "editorial">
>;

/** Les overrides sont indexés par nom de fichier d'origine, ex. "IMG_0042.jpg". */
export type PhotoOverrides = Record<string, PhotoOverride>;

export interface Chapter {
  id: UniverseId;
  number: string;
  label: string;
  title: string;
  route: string;
  anchor: string;
}

export interface UniverseData extends Chapter {
  tagline: string;
  photos: Photo[];
}
