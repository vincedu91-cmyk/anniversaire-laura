"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { chapters } from "@/data/timeline";
import { useScene } from "../shared/SceneContext";
import { UniverseIndicator } from "./UniverseIndicator";

/**
 * Navigation immersive: chronologie de vie verticale (desktop) / barre basse (mobile).
 * Sur l'accueil les liens défilent vers les ancres, ailleurs ils ouvrent la page de l'univers.
 */
export function UniverseNavigation() {
  const pathname = usePathname();
  const { scene } = useScene();
  const onHome = pathname === "/";

  return (
    <nav
      aria-label="Chronologie des univers"
      className="fixed z-(--z-nav) text-(--nav-ink) transition-colors duration-500 max-md:inset-x-0 max-md:bottom-0 max-md:border-t max-md:border-current max-md:bg-[color-mix(in_srgb,var(--u-bg)_88%,transparent)] max-md:backdrop-blur-sm md:left-8 md:top-1/2 md:-translate-y-1/2"
    >
      <ol className="flex items-stretch justify-around md:flex-col md:items-start md:gap-7">
        {chapters.map((chapter) => {
          const active = scene === chapter.id;
          const href = onHome ? `/#${chapter.anchor}` : chapter.route;
          return (
            <li key={chapter.id} className="max-md:flex-1">
              <Link
                href={href}
                aria-current={active ? "location" : undefined}
                data-cursor
                className="group relative flex items-center gap-3 px-3 py-3 md:px-0 md:py-0 max-md:justify-center"
              >
                <UniverseIndicator active={active} />
                <span className="mono tabular-nums opacity-70">{chapter.number}</span>
                <span
                  className={`mono font-semibold transition-all duration-(--motion-medium) ease-(--ease-out) md:origin-left ${
                    active ? "max-md:inline md:translate-x-0 md:opacity-100" : "max-md:hidden md:-translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:group-focus-visible:translate-x-0 md:group-focus-visible:opacity-100"
                  }`}
                >
                  {chapter.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
