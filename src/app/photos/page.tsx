import type { Metadata } from "next";
import { PartyUpload } from "@/components/gallery/PartyUpload";

// Page ouverte par le QR code de la soirée: privée, jamais indexée.
export const metadata: Metadata = {
  title: "Ta photo pour Laura",
  description: "Ajoute tes photos de la soirée des 18 ans de Laura: elles s'affichent dans la galerie.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/photos" },
};

export default function PhotosPage() {
  return (
    <section data-scene="finale" data-universe="finale" className="min-h-dvh bg-(--u-bg) px-4 pb-[12dvh] pt-[7dvh] text-(--u-ink) md:mx-auto md:max-w-[46rem] md:px-0">
      <p className="mono text-(--u-accent)">LA SOIRÉE DE LAURA</p>
      <h1 className="display mt-4 text-[clamp(3.4rem,17vw,8rem)]">
        TA PHOTO,<br />
        <span className="text-(--u-accent)">DANS LA GALERIE.</span>
      </h1>
      <p className="mt-6 max-w-[34ch] text-xl leading-snug">Elle s&apos;affiche tout de suite, sur le site et sur l&apos;écran de la salle.</p>
      <div className="mt-10">
        <PartyUpload />
      </div>
    </section>
  );
}
