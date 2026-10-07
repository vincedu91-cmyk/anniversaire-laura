import { adolescence } from "@/data/adolescence";
import { AdolescenceHero } from "./AdolescenceHero";
import { AdolescenceTrack } from "./AdolescenceTrack";

// Les 3 premières photos habillent le hero, toute la galerie défile ensuite à l'horizontale.
const HERO_PHOTOS = 3;

/** Univers 02: adolescence. */
export function AdolescenceSection() {
  const { photos } = adolescence;
  const gallery = photos.length > HERO_PHOTOS ? photos.slice(HERO_PHOTOS) : photos;
  return (
    <section
      id={adolescence.anchor}
      data-scene="adolescence"
      data-universe="adolescence"
      className="relative overflow-x-clip bg-(--u-bg) text-(--u-ink)"
    >
      <AdolescenceHero universe={adolescence} />
      <AdolescenceTrack photos={gallery} />
    </section>
  );
}
