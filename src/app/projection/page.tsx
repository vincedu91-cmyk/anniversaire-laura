import type { Metadata } from "next";
import { ProjectionPlayer } from "@/components/projection/ProjectionPlayer";

// Mode écran géant: lancé à la main le jour de la fête, jamais indexé.
export const metadata: Metadata = {
  title: "Projection",
  robots: { index: false, follow: false },
  alternates: { canonical: "/projection" },
};

export default function ProjectionPage() {
  return <ProjectionPlayer />;
}
