import { AdolescenceToMischief } from "@/sections/transitions/AdolescenceToMischief";
import { ChildhoodToAdolescence } from "@/sections/transitions/ChildhoodToAdolescence";
import { MischiefToFinale } from "@/sections/transitions/MischiefToFinale";

export type TransitionKind = "childhood-adolescence" | "adolescence-mischief" | "mischief-finale";

const SCENES: Record<TransitionKind, () => React.JSX.Element> = {
  "childhood-adolescence": ChildhoodToAdolescence,
  "adolescence-mischief": AdolescenceToMischief,
  "mischief-finale": MischiefToFinale,
};

/** Passage cinématographique d'un univers à l'autre. Chaque scène est pilotée par le scroll. */
export function TransitionScene({ kind }: { kind: TransitionKind }) {
  const Scene = SCENES[kind];
  return <Scene />;
}
