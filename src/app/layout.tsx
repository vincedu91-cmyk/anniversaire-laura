import type { Metadata, Viewport } from "next";
import { Anton, Bangers, Bricolage_Grotesque, Caveat, Geist_Mono, Reenie_Beanie } from "next/font/google";
import "@/styles/globals.css";
import { ExperienceShell } from "@/components/shared/ExperienceShell";

// Une famille principale (tous univers) + une secondaire commune + trois accents d'univers.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", axes: ["opsz", "wdth"], display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const bangers = Bangers({ subsets: ["latin"], weight: "400", variable: "--font-bangers", display: "swap" });
// Annotations au stylo bille de l'Univers 03.
const reenie = Reenie_Beanie({ subsets: ["latin"], weight: "400", variable: "--font-reenie", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Laura — 18 ans de souvenirs";
const DESCRIPTION = "18 années de souvenirs, de sourires, de bêtises et de moments inoubliables.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Laura, 18 ans" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Laura, 18 ans",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d11",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${geistMono.variable} ${caveat.variable} ${anton.variable} ${bangers.variable} ${reenie.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Aller au contenu
        </a>
        <ExperienceShell>{children}</ExperienceShell>
      </body>
    </html>
  );
}
