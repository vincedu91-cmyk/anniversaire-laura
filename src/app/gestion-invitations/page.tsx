import type { Metadata } from "next";
import { GuestAdmin } from "@/components/rsvp/GuestAdmin";

// Page d'organisation: aucun lien depuis le site, jamais indexée, protégée par secret.
export const metadata: Metadata = {
  title: "Gestion des invitations",
  robots: { index: false, follow: false },
  alternates: { canonical: "/gestion-invitations" },
};

export default function GuestAdminPage() {
  return (
    <section data-scene="childhood" data-universe="childhood" className="min-h-dvh bg-(--u-bg) px-4 pb-[14dvh] pt-[10dvh] text-(--u-ink) md:px-[6vw]">
      <h1 className="display text-[clamp(2.5rem,7vw,7rem)]">INVITATIONS</h1>
      <p className="mt-3 max-w-[56ch] text-lg">
        Qui vient, qui ne vient pas, qui n&apos;a pas répondu. Chaque invité a un lien personnel à glisser dans l&apos;e-mail.
      </p>
      <div className="mt-[5dvh]">
        <GuestAdmin />
      </div>
    </section>
  );
}
