import type { Metadata } from "next";
import { Suspense } from "react";
import { RsvpPanel } from "@/components/rsvp/RsvpPanel";

// Page personnelle (lien reçu par e-mail): jamais indexée.
export const metadata: Metadata = {
  title: "Ta réponse",
  description: "Dis-nous si tu seras là pour les 18 ans de Laura.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/invitation" },
};

export default function InvitationPage() {
  return (
    <section data-scene="mischief" data-universe="mischief" className="min-h-dvh bg-(--u-bg) px-4 pb-[14dvh] pt-[14dvh] text-(--u-ink) md:pl-44 md:pr-[8vw]">
      <Suspense fallback={<p className="mono">CHARGEMENT...</p>}>
        <RsvpPanel />
      </Suspense>
    </section>
  );
}
