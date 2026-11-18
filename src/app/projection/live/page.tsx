import type { Metadata } from "next";
import { LiveWall } from "@/components/gallery/LiveWall";

// Mur live pour l'écran géant: lancé à la main pendant la soirée, jamais indexé.
export const metadata: Metadata = {
  title: "Mur live",
  robots: { index: false, follow: false },
  alternates: { canonical: "/projection/live" },
};

export default function LiveWallPage() {
  return <LiveWall mode="live" />;
}
