import type { Metadata } from "next";
import { GuestbookForm } from "@/components/guestbook/GuestbookForm";

// Page privée: partagée par lien aux proches, jamais indexée.
export const metadata: Metadata = {
  title: "Un mot pour Laura",
  description: "Laisse un message écrit ou vocal pour les 18 ans de Laura.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/livre-d-or" },
};

export default function GuestbookPage() {
  return (
    <section data-scene="childhood" data-universe="childhood" className="min-h-dvh bg-(--u-bg) px-4 pb-[14dvh] pt-[16dvh] text-(--u-ink) md:pl-44 md:pr-[8vw]">
      <h1 className="display text-[clamp(3.5rem,11vw,11rem)]">UN MOT POUR LAURA</h1>
      <p className="mt-6 max-w-[40ch] font-hand text-3xl leading-snug md:text-4xl">
        Laisse un message écrit ou vocal pour ses 18 ans.
      </p>
      <div className="mt-[8dvh] max-w-[40rem]">
        <GuestbookForm />
      </div>
    </section>
  );
}
