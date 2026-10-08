import { mischief } from "@/data/mischief";
import { pickPhotos } from "@/data/photos";
import { LauraDossier } from "./LauraDossier";
import { LauraEvidence } from "./LauraEvidence";
import { LauraIntro } from "./LauraIntro";

const DOSSIER_COUNT = 4;
const EVIDENCE_COUNT = 10;

/** Univers 03: "ET PUIS IL Y A LAURA, QUOI..." Intro, dossier, preuves, chaos contrôlé, freeze. */
export function LauraSection() {
  const { photos } = mischief;
  return (
    <>
      <LauraIntro />
      <LauraDossier photos={pickPhotos(photos, DOSSIER_COUNT, 0)} group={photos} />
      <LauraEvidence photos={pickPhotos(photos, EVIDENCE_COUNT, DOSSIER_COUNT)} />
    </>
  );
}
