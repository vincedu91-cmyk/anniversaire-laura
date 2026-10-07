import type { Metadata } from "next";
import { UniverseNext } from "@/components/shared/UniverseNext";
import { ChildhoodSection } from "@/sections/childhood/ChildhoodSection";

export const metadata: Metadata = {
  title: "Naissance et enfance",
  description: "Le monde avant qu'elle ne sache encore qu'elle allait devenir Laura.",
  alternates: { canonical: "/naissance-enfance" },
};

export default function ChildhoodPage() {
  return (
    <>
      <h1 className="sr-only">Naissance et enfance de Laura</h1>
      <ChildhoodSection />
      <UniverseNext from="childhood" />
    </>
  );
}
