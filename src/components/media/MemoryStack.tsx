"use client";

import type { Photo } from "@/data/types";
import { MemoryPhoto } from "./MemoryPhoto";

interface MemoryStackProps {
  photos: readonly Photo[];
  className?: string;
  frameClassName?: string;
}

/** Pile de photos en éventail: au survol (ou au focus), l'éventail s'ouvre. Rotation fixe, pas d'animation autonome. */
export function MemoryStack({ photos, className = "", frameClassName = "" }: MemoryStackProps) {
  const mid = (photos.length - 1) / 2;
  return (
    <div className={`group/stack relative aspect-[4/5] ${className}`}>
      {photos.map((photo, i) => {
        const offset = i - mid;
        return (
          <div
            key={`${photo.id}-${i}`}
            className="absolute inset-0 origin-bottom transition-transform duration-(--motion-slow) ease-(--ease-spring) [transform:translateX(calc(var(--k)*3%))_rotate(calc(var(--k)*7deg))] group-focus-within/stack:[transform:translateX(calc(var(--k)*34%))_rotate(calc(var(--k)*14deg))] group-hover/stack:[transform:translateX(calc(var(--k)*34%))_rotate(calc(var(--k)*14deg))] motion-reduce:transition-none"
            style={{ ["--k" as string]: offset }}
          >
            <MemoryPhoto
              photo={photo}
              index={i}
              group={photos}
              ratio="4 / 5"
              sizes="(min-width: 768px) 22rem, 70vw"
              className="h-full w-full"
              frameClassName={frameClassName}
            />
          </div>
        );
      })}
    </div>
  );
}
