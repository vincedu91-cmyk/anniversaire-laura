import type { Metadata } from "next";
import { UniverseNext } from "@/components/shared/UniverseNext";
import { LauraSection } from "@/sections/laura/LauraSection";

export const metadata: Metadata = {
  title: "Et puis il y a Laura, quoi...",
  description: "On pourrait raconter Laura de manière sérieuse. Mais ce serait oublier un détail important.",
  alternates: { canonical: "/et-puis-il-y-a-laura" },
};

export default function LauraPage() {
  return (
    <>
      <h1 className="sr-only">Et puis il y a Laura, quoi...</h1>
      <LauraSection />
      <UniverseNext from="mischief" />
    </>
  );
}
