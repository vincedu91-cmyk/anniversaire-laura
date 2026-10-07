"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { SceneProvider } from "./SceneContext";
import { Cursor } from "./Cursor";
import { Loader } from "./Loader";
import { SoundToggle } from "./SoundToggle";
import { PhotoViewerProvider } from "../media/PhotoViewer";
import { UniverseNavigation } from "../navigation/UniverseNavigation";
import { ScrollProgress } from "../navigation/ScrollProgress";
import { FilmShortcut } from "../navigation/FilmShortcut";

/** Coque de l'expérience: contexte de scène, navigation, curseur, son, visionneuse. */
export function ExperienceShell({ children }: { children: ReactNode }) {
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
