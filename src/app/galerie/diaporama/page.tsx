import type { Metadata } from "next";
import { LiveWall } from "@/components/gallery/LiveWall";

// Diaporama automatique des meilleures photos: privé (lien avec clé), jamais indexé.
export const metadata: Metadata = {
  title: "Diaporama de la soirée",
  robots: { index: false, follow: false },
  alternates: { canonical: "/galerie/diaporama" },
};

export default function SlideshowPage() {
  return <LiveWall mode="best" />;
}
