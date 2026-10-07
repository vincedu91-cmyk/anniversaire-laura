import { childhood, childhoodEditorial } from "@/data/childhood";
import { pickPhotos, restPhotos } from "@/data/photos";
import { Bubbles } from "./Bubbles";
import { ChildhoodHero } from "./ChildhoodHero";
import {
  CompositionImmense,
  CompositionMosaic,
  CompositionOrbit,
  CompositionOrganic,
  CompositionVertical,
} from "./compositions";

// 1 hero + A(1) + B(3) + C(1) + D(1) = 7 photos "scénarisées", le reste va dans la mosaïque E.
const SCRIPTED = 7;
const MOSAIC_MIN = 5;

/** Univers 01: naissance et enfance. Cinq compositions successives, jamais une grille. */
export function ChildhoodSection() {
  const { photos } = childhood;
  const pick = (count: number, start: number) => pickPhotos(photos, count, start);
  const mosaic = restPhotos(photos, SCRIPTED);
  const mosaicPhotos = mosaic.length >= MOSAIC_MIN ? mosaic : pick(MOSAIC_MIN, SCRIPTED);

  return (
    <section
      id={childhood.anchor}
      data-scene="childhood"
      data-universe="childhood"
      className="relative overflow-x-clip bg-(--u-bg) text-(--u-ink)"
    >
      <Bubbles />
      <ChildhoodHero universe={childhood} />
      <CompositionImmense
        photo={pick(1, 1)[0]}
        index={1}
        group={photos}
        quote={childhoodEditorial.photoIndex === 1 ? childhoodEditorial.quote : undefined}
      />
      <CompositionOrbit photos={pick(3, 2)} startIndex={2} group={photos} />
      <CompositionVertical photo={pick(1, 5)[0]} index={5} group={photos} />
      <CompositionOrganic photo={pick(1, 6)[0]} index={6} group={photos} />
      <CompositionMosaic photos={mosaicPhotos} startIndex={SCRIPTED} group={photos} />
    </section>
  );
}
