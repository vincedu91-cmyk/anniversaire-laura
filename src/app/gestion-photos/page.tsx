import type { Metadata } from "next";
import { PartyAdmin } from "@/components/gallery/PartyAdmin";

// Page privée de l'organisateur, sans lien depuis le site, jamais indexée.
export const metadata: Metadata = {
  title: "Gestion de la galerie",
  robots: { index: false, follow: false },
  alternates: { canonical: "/gestion-photos" },
};

export default function PhotoAdminPage() {
  return (
    <section data-scene="childhood" data-universe="childhood" className="min-h-dvh bg-(--u-bg) px-4 pb-[14dvh] pt-[10dvh] text-(--u-ink) md:px-[6vw]">
      <h1 className="display text-[clamp(2.5rem,8vw,7rem)]">GALERIE DE LA SOIRÉE</h1>
      <p className="mt-4 max-w-[52ch] text-lg">Liens, ouverture des envois, masquage des photos et export. Les photos sont publiées tout de suite: masque ici celle qui ne doit pas rester.</p>
      <div className="mt-[6dvh]">
        <PartyAdmin />
      </div>
    </section>
  );
}
