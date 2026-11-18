import type { Metadata } from "next";
import { PartyGallery } from "@/components/gallery/PartyGallery";

// Album de la soirée: privé (lien avec clé), jamais indexé.
export const metadata: Metadata = {
  title: "La galerie de la soirée",
  description: "Les photos de la soirée des 18 ans de Laura, envoyées par ses proches.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/galerie" },
};

export default function GalleryPage() {
  return (
    <section data-scene="finale" data-universe="finale" className="min-h-dvh bg-(--u-bg) px-3 pb-[12dvh] pt-[7dvh] text-(--u-ink) md:px-[5vw]">
      <p className="mono text-(--u-accent)">LA SOIRÉE DE LAURA</p>
      <h1 className="display mt-4 text-[clamp(3.2rem,13vw,10rem)]">LA GALERIE</h1>
      <div className="mt-8">
        <PartyGallery />
      </div>
    </section>
  );
}
