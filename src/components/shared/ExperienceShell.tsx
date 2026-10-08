"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
import { SceneProvider } from "./SceneContext";
import { Cursor } from "./Cursor";
import { Loader } from "./Loader";
import { SoundToggle } from "./SoundToggle";
import { PhotoViewerProvider } from "../media/PhotoViewer";
import { UniverseNavigation } from "../navigation/UniverseNavigation";
import { ScrollProgress } from "../navigation/ScrollProgress";
import { FilmShortcut } from "../navigation/FilmShortcut";

/** Pages volontairement absentes de la navigation: projection, réponse d'invité, administration. */
const BARE_PATHS = ["/projection", "/invitation", "/gestion-invitations", "/moderation"];

/** Coque de l'expérience: contexte de scène, navigation, curseur, son, visionneuse. */
export function ExperienceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Pages sans interface de site (navigation, curseur, boutons): écran géant et pages utilitaires.
  if (BARE_PATHS.includes(pathname)) {
    return (
      <MotionConfig reducedMotion={pathname === "/projection" ? "never" : "user"}>
        <SceneProvider>
          <div className="grain" aria-hidden="true" />
          <main id="main">{children}</main>
        </SceneProvider>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <SceneProvider>
        <PhotoViewerProvider>
          <Loader />
          <div className="grain" aria-hidden="true" />
          <ScrollProgress />
          <UniverseNavigation />
          <div className="fixed right-4 top-4 z-(--z-nav) flex items-center gap-3 text-(--nav-ink) transition-colors duration-500 md:right-8 md:top-7">
            <FilmShortcut />
            <SoundToggle />
          </div>
          <Cursor />
          <main id="main">{children}</main>
        </PhotoViewerProvider>
      </SceneProvider>
    </MotionConfig>
  );
}
