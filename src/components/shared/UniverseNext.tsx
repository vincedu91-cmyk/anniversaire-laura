import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { nextAfter } from "@/data/timeline";
import type { UniverseId } from "@/data/types";

const TONES: Record<UniverseId, string> = {
  childhood: "bg-adolescence-background text-adolescence-ink",
  adolescence: "bg-mischief-background text-mischief-ink",
  mischief: "bg-finale-background text-finale-gold",
};

/** Fin de page d'univers: grand lien vers la suite du parcours. */
export function UniverseNext({ from }: { from: UniverseId }) {
  const next = nextAfter(from);
  return (
    <section className={`px-4 py-[18dvh] md:pl-44 ${TONES[from]}`} aria-label="La suite du parcours">
      <Link href={next.route} data-cursor className="group block w-fit">
        {next.number && <p className="mono">{next.number}</p>}
        <p className="display flex items-center gap-[0.15em] text-[clamp(3rem,13vw,14rem)]">
          {next.label}
          <ArrowRight weight="bold" aria-hidden="true" className="size-[0.7em] transition-transform duration-(--motion-medium) ease-(--ease-spring) group-hover:translate-x-4" />
        </p>
      </Link>
    </section>
  );
}
