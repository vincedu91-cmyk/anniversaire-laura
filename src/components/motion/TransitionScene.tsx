import { AdolescenceToLaura } from "@/sections/transitions/AdolescenceToLaura";
import { ChildhoodToAdolescence } from "@/sections/transitions/ChildhoodToAdolescence";
import { LauraToFinale } from "@/sections/transitions/LauraToFinale";

export type TransitionKind = "childhood-adolescence" | "adolescence-laura" | "laura-finale";

const SCENES: Record<TransitionKind, () => React.JSX.Element> = {
  "childhood-adolescence": ChildhoodToAdolescence,
  "adolescence-laura": AdolescenceToLaura,
  "laura-finale": LauraToFinale,
};

/** Passage cinématographique d'un univers à l'autre. Chaque scène est pilotée par le scroll. */
export function TransitionScene({ kind }: { kind: TransitionKind }) {
  const Scene = SCENES[kind];
  return <Scene />;
}
