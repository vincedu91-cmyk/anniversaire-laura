import type { Metadata } from "next";
import { UniverseNext } from "@/components/shared/UniverseNext";
import { MischiefSection } from "@/sections/mischief/MischiefSection";

export const metadata: Metadata = {
  title: "Les bêtises",
  description: "Certaines preuves auraient dû disparaître. Heureusement, non.",
  alternates: { canonical: "/les-betises" },
};

export default function MischiefPage() {
  return (
    <>
      <h1 className="sr-only">Les bêtises de Laura</h1>
      <MischiefSection />
      <UniverseNext from="mischief" />
    </>
  );
}
