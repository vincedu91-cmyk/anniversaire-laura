"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SceneId } from "@/data/types";
import { sceneForPath } from "@/data/timeline";
import { audio } from "@/lib/audio";

interface SceneState {
  scene: SceneId;
  soundOn: boolean;
  toggleSound: () => void;
}

const SceneContext = createContext<SceneState>({
  scene: "intro",
  soundOn: false,
  toggleSound: () => undefined,
});

export const useScene = () => useContext(SceneContext);

const SECTION_SELECTOR = "[data-scene]";

/**
 * Détermine la scène active (section qui croise le milieu du viewport),
 * la publie sur <html data-scene> (couleur de navigation) et pilote l'ambiance sonore.
 */
export function SceneProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [scene, setScene] = useState<SceneId>(() => sceneForPath(pathname));
  const [soundOn, setSoundOn] = useState(false);

  // Changement de page: on repart de la scène du chemin (ajustement d'état pendant le rendu).
  const [knownPath, setKnownPath] = useState(pathname);
  if (knownPath !== pathname) {
    setKnownPath(pathname);
    setScene(sceneForPath(pathname));
  }

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(SECTION_SELECTOR);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setScene(entry.target.getAttribute("data-scene") as SceneId);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.scene = scene;
    audio.setScene(scene);
  }, [scene]);

  const toggleSound = useCallback(() => {
    if (audio.isEnabled()) {
      audio.disable();
      setSoundOn(false);
    } else {
      void audio.enable().then(() => setSoundOn(true));
    }
  }, []);

  const value = useMemo(() => ({ scene, soundOn, toggleSound }), [scene, soundOn, toggleSound]);
  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}
