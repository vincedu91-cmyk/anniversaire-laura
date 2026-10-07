import type { Metadata } from "next";
import { ModerationBoard } from "@/components/guestbook/ModerationBoard";

export const metadata: Metadata = {
  title: "Modération du livre d'or",
  robots: { index: false, follow: false },
  alternates: { canonical: "/moderation" },
};

export default function ModerationPage() {
  return (
    <section data-scene="childhood" data-universe="childhood" className="min-h-dvh bg-(--u-bg) px-4 pb-[14dvh] pt-[16dvh] text-(--u-ink) md:pl-44 md:pr-[8vw]">
      <h1 className="display text-[clamp(2.5rem,8vw,8rem)]">MODÉRATION</h1>
      <p className="mt-4 max-w-[46ch] text-lg">Relis chaque message avant qu&apos;il ne soit montré à Laura. Un message n&apos;apparaît dans le site qu&apos;une fois approuvé.</p>
      <div className="mt-[6dvh]">
        <ModerationBoard />
      </div>
    </section>
  );
}
