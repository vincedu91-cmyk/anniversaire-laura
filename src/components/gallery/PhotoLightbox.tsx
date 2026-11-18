"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, DownloadSimple, Heart, X } from "@phosphor-icons/react";
import { challengeTitle, photoUrl, type PartyPhoto } from "@/data/party";

const SWIPE_PX = 60;

interface LightboxProps {
  photos: readonly PartyPhoto[];
  openId: string;
  hearted: ReadonlySet<string>;
  onHeart: (id: string) => void;
  onClose: () => void;
  onChange: (id: string) => void;
}

export function PhotoLightbox({ photos, openId, hearted, onHeart, onClose, onChange }: LightboxProps) {
  const index = photos.findIndex((photo) => photo.id === openId);
  const photo = index >= 0 ? photos[index] : null;
  const panel = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);

  const step = useCallback(
    (delta: number) => {
      if (photos.length < 2 || index < 0) return;
      onChange(photos[(index + delta + photos.length) % photos.length].id);
    },
    [index, onChange, photos],
  );

  // La photo ouverte a été retirée entre-temps: on ferme proprement.
  useEffect(() => {
    if (!photo) onClose();
  }, [photo, onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "Tab" && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>("button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose, step]);

  if (!photo) return null;

  const download = async () => {
    setSaving(true);
    try {
      const response = await fetch(photoUrl(photo.id));
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `laura-18-ans-${photo.id.slice(0, 8)}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(photoUrl(photo.id), "_blank", "noopener");
    }
    setSaving(false);
  };

  const isHearted = hearted.has(photo.id);
  const title = challengeTitle(photo.challenge);
  const meta = [photo.author_name, photo.kind === "souvenir" ? (photo.year ? `Souvenir ${photo.year}` : "Souvenir") : null, title].filter(Boolean);

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Photo en plein écran"
      className="fixed inset-0 z-(--z-viewer) flex flex-col bg-black/95 text-finale-ink"
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(dx) > SWIPE_PX) step(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between p-3 md:p-6">
        <p className="mono">{index + 1} / {photos.length}</p>
        <button type="button" onClick={onClose} aria-label="Fermer" className="border border-current p-3">
          <X size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-2 md:px-20">
        {/* eslint-disable-next-line @next/next/no-img-element -- photo du stockage Supabase, déjà réduite côté téléphone */}
        <img key={photo.id} src={photoUrl(photo.id)} alt={photo.caption ?? `Photo de la soirée${photo.author_name ? ` par ${photo.author_name}` : ""}`} className="mx-auto h-full w-full object-contain" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Photo précédente" className="absolute left-2 top-1/2 hidden -translate-y-1/2 border border-current bg-black/50 p-3 md:block">
              <CaretLeft size={22} weight="bold" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Photo suivante" className="absolute right-2 top-1/2 hidden -translate-y-1/2 border border-current bg-black/50 p-3 md:block">
              <CaretRight size={22} weight="bold" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 p-4 md:px-20 md:py-6">
        <div className="max-w-[60ch]">
          {photo.caption && <p className="font-hand text-3xl leading-tight">{photo.caption}</p>}
          {meta.length > 0 && <p className="mono mt-2 text-finale-ink/75">{meta.join(" / ")}</p>}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            aria-pressed={isHearted}
            onClick={() => onHeart(photo.id)}
            className={`flex items-center gap-2 border-2 px-4 py-3 font-semibold ${isHearted ? "border-finale-gold bg-finale-gold text-finale-background" : "border-finale-ink/40"}`}
          >
            <Heart size={22} weight={isHearted ? "fill" : "regular"} aria-hidden="true" />
            <span aria-label={`${photo.hearts} j'aime`}>{photo.hearts}</span>
          </button>
          <button type="button" onClick={() => void download()} disabled={saving} aria-label="Télécharger la photo" className="border-2 border-finale-ink/40 p-3 disabled:opacity-50">
            <DownloadSimple size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
