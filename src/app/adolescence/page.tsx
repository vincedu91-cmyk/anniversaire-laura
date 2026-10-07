import type { Metadata } from "next";
import { UniverseNext } from "@/components/shared/UniverseNext";
import { AdolescenceSection } from "@/sections/adolescence/AdolescenceSection";

export const metadata: Metadata = {
  title: "Adolescence",
  description: "Rapide, coloré, chaotique, social, énergique : l'adolescence de Laura.",
  alternates: { canonical: "/adolescence" },
};

export default function AdolescencePage() {
  return (
    <>
      <h1 className="sr-only">Adolescence de Laura</h1>
      <AdolescenceSection />
      <UniverseNext from="adolescence" />
    </>
  );
}
