"use client";

import Link from "next/link";
import { Play } from "@phosphor-icons/react";
import { filmChapter } from "@/data/timeline";
import { MagneticWrap } from "../motion/MagneticWrap";

/** Accès permanent et évident au film. */
export function FilmShortcut() {
  return (
    <MagneticWrap strength={0.35}>
      <Link
        href={filmChapter.route}
        className="mono flex items-center gap-2 border border-current px-3 py-2 transition-transform duration-(--motion-fast) active:scale-[0.97]"
      >
        <Play size={16} weight="fill" aria-hidden="true" />
        <span>LE FILM</span>
      </Link>
    </MagneticWrap>
  );
}
