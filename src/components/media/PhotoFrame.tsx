import Image from "next/image";
import type { Photo, UniverseId } from "@/data/types";

interface Tone {
  bg: string;
  fg: string;
}

// Classes complètes (Tailwind ne génère que les noms écrits en entier).
const TONES: Record<UniverseId, readonly Tone[]> = {
  childhood: [
    { bg: "bg-childhood-primary", fg: "text-childhood-ink" },
    { bg: "bg-childhood-secondary", fg: "text-childhood-ink" },
    { bg: "bg-childhood-butter", fg: "text-childhood-ink" },
    { bg: "bg-childhood-lavender", fg: "text-childhood-ink" },
  ],
  adolescence: [
    { bg: "bg-adolescence-primary", fg: "text-adolescence-background" },
    { bg: "bg-adolescence-secondary", fg: "text-adolescence-background" },
    { bg: "bg-adolescence-violet", fg: "text-adolescence-ink" },
    { bg: "bg-adolescence-electric", fg: "text-adolescence-ink" },
  ],
  mischief: [
    { bg: "bg-mischief-secondary", fg: "text-mischief-paper" },
    { bg: "bg-mischief-blue", fg: "text-mischief-paper" },
    { bg: "bg-mischief-green", fg: "text-mischief-ink" },
    { bg: "bg-mischief-paper", fg: "text-mischief-ink" },
  ],
};

interface PhotoFrameProps {
  photo: Photo;
  sizes: string;
  /** Index d'affichage: choisit la teinte du cadre vide et son numéro. */
  index?: number;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}

/** Image réelle (next/image) ou cadre `[PHOTO À AJOUTER]` quand la photo n'existe pas encore. */
export function PhotoFrame({ photo, sizes, index = 0, priority = false, className = "", imageClassName = "" }: PhotoFrameProps) {
  if (!photo.placeholder) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          decoding="async"
          placeholder={photo.blurDataURL ? "blur" : "empty"}
          blurDataURL={photo.blurDataURL}
          className={`object-cover ${imageClassName}`}
        />
      </div>
    );
  }

  const tones = TONES[photo.universe];
  const tone = tones[index % tones.length];
  return (
    <div
      role="img"
      aria-label={photo.alt}
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden p-[6%] ${tone.bg} ${tone.fg} ${className}`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 opacity-[0.14] ${imageClassName}`}
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 14px)",
        }}
      />
      <span className="display relative text-[clamp(3rem,12cqw,9rem)] opacity-90">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="mono relative text-[0.7rem] leading-tight">[PHOTO À AJOUTER]</span>
    </div>
  );
}
