import { mischief } from "@/data/mischief";
import { pickPhotos } from "@/data/photos";
import { EvidenceBoard } from "./EvidenceBoard";
import { MischiefGallery } from "./MischiefGallery";
import { MischiefHero } from "./MischiefHero";

const HERO_COUNT = 4;
const BOARD_COUNT = 6;
const GALLERY_MIN = 4;

/** Univers 03: les bêtises. Entrée dramatique, preuves en scrapbook, puis mur d'enquête. */
export function MischiefSection() {
  const { photos } = mischief;
  const enough = photos.length >= HERO_COUNT + BOARD_COUNT + GALLERY_MIN;

  const heroPhotos = pickPhotos(photos, HERO_COUNT, 0);
  const boardPhotos = enough
    ? photos.slice(HERO_COUNT, HERO_COUNT + BOARD_COUNT)
    : pickPhotos(photos, BOARD_COUNT, 2);
  const galleryPhotos = enough
    ? photos.slice(HERO_COUNT + BOARD_COUNT)
    : pickPhotos(photos, GALLERY_MIN + 1, HERO_COUNT);

  return (
    <section
      id={mischief.anchor}
      data-scene="mischief"
      data-universe="mischief"
      className="relative overflow-x-clip bg-(--u-bg) text-(--u-ink)"
    >
      <MischiefHero tagline={mischief.tagline} stack={heroPhotos} />
      <MischiefGallery photos={galleryPhotos} group={photos} />
      <EvidenceBoard photos={boardPhotos} group={photos} />
    </section>
  );
}
