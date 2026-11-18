"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Camera, Heart, Play } from "@phosphor-icons/react";
import { challenges, thumbUrl, type PartyPhoto } from "@/data/party";
import { PhotoLightbox } from "./PhotoLightbox";
import { usePartyGallery } from "./usePartyGallery";

type Filter = string;

const PAGE = 60;
const CHIP = "shrink-0 border-2 px-3 py-2 text-sm font-semibold transition-colors duration-(--motion-fast)";

function applyFilter(photos: readonly PartyPhoto[], filter: Filter): readonly PartyPhoto[] {
  if (filter === "all") return photos.filter((photo) => photo.kind === "soiree");
  if (filter === "souvenir") return photos.filter((photo) => photo.kind === "souvenir");
  if (filter === "best") {
    return photos
      .filter((photo) => photo.hearts > 0)
      .sort((a, b) => b.hearts - a.hearts || (a.created_at < b.created_at ? 1 : -1));
  }
  return photos.filter((photo) => photo.challenge === filter);
}

/** Galerie de la soirée: mur de photos, défis, souvenirs, cœurs. Se met à jour toute seule. */
export function PartyGallery() {
  const { key, status, photos, hearted, toggleHeart } = usePartyGallery(8000);
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byChallenge = new Map<string, number>();
    for (const photo of photos) if (photo.challenge) byChallenge.set(photo.challenge, (byChallenge.get(photo.challenge) ?? 0) + 1);
    return {
      all: photos.filter((photo) => photo.kind === "soiree").length,
      best: photos.filter((photo) => photo.hearts > 0).length,
      souvenir: photos.filter((photo) => photo.kind === "souvenir").length,
      byChallenge,
    };
  }, [photos]);

  const visible = useMemo(() => applyFilter([...photos], filter), [photos, filter]);
  const close = useCallback(() => setOpenId(null), []);
  const select = (next: Filter) => {
    setFilter(next);
    setShown(PAGE);
  };

  if (key === undefined) return <p className="mono text-finale-ink/60">CHARGEMENT...</p>;
  if (key === null || status === "denied") {
    return (
      <div role="status" className="border-2 border-finale-gold/60 p-6">
        <p className="display text-4xl text-finale-gold">LIEN INCOMPLET</p>
        <p className="mt-4 max-w-[36ch] text-lg">Ouvre la galerie avec le lien ou le QR code de la soirée.</p>
      </div>
    );
  }

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "La soirée", count: counts.all },
    { id: "best", label: "Les plus aimées", count: counts.best },
    ...challenges.map((item) => ({ id: item.id, label: item.title, count: counts.byChallenge.get(item.id) ?? 0 })),
    { id: "souvenir", label: "Souvenirs", count: counts.souvenir },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/photos" className="flex items-center gap-2 bg-finale-gold px-5 py-3 font-bold text-finale-background">
          <Camera size={22} weight="fill" aria-hidden="true" /> Ajouter une photo
        </Link>
        <Link href="/galerie/diaporama" className="flex items-center gap-2 border-2 border-finale-ink/40 px-5 py-3 font-semibold">
          <Play size={20} weight="fill" aria-hidden="true" /> Diaporama
        </Link>
      </div>

      <div role="group" aria-label="Filtrer les photos" className="-mx-3 mt-8 flex gap-2 overflow-x-auto px-3 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={filter === chip.id}
            onClick={() => select(chip.id)}
            className={`${CHIP} ${filter === chip.id ? "border-finale-gold bg-finale-gold text-finale-background" : "border-finale-ink/30"}`}
          >
            {chip.label} <span className="opacity-70">({chip.count})</span>
          </button>
        ))}
      </div>

      {status === "offline" && <p role="status" className="mt-6 text-finale-gold">Connexion perdue. On réessaie...</p>}
      {status === "loading" && <p role="status" className="mono mt-10 text-finale-ink/60">CHARGEMENT DES PHOTOS...</p>}

      {status === "ready" && visible.length === 0 && (
        <p role="status" className="mt-12 max-w-[40ch] text-xl">
          {filter === "best" ? "Aucun cœur pour le moment: touche une photo, puis le cœur." : "Rien ici pour le moment. Sois la première personne à ajouter une photo."}
        </p>
      )}

      <ul className="mt-8 columns-2 gap-2 md:columns-3 lg:columns-4">
        {visible.slice(0, shown).map((photo) => (
          <li key={photo.id} className="mb-2 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenId(photo.id)}
              aria-label={`Ouvrir la photo${photo.author_name ? ` de ${photo.author_name}` : ""}`}
              className="group relative block w-full overflow-hidden bg-finale-ink/10"
              style={{ aspectRatio: photo.width && photo.height ? `${photo.width} / ${photo.height}` : "4 / 3" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- miniature du stockage, déjà réduite côté téléphone */}
              <img src={thumbUrl(photo.id)} alt={photo.caption ?? ""} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-(--motion-medium) group-hover:scale-[1.04]" />
              {photo.hearts > 0 && (
                <span className="absolute bottom-1 right-1 flex items-center gap-1 bg-black/70 px-2 py-1 text-xs font-bold text-finale-gold">
                  <Heart size={12} weight="fill" aria-hidden="true" /> {photo.hearts}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {visible.length > shown && (
        <button type="button" onClick={() => setShown((value) => value + PAGE)} className="mt-8 border-2 border-finale-ink/40 px-6 py-3 font-semibold">
          Voir plus ({visible.length - shown})
        </button>
      )}

      {openId && <PhotoLightbox photos={visible} openId={openId} hearted={hearted} onHeart={toggleHeart} onClose={close} onChange={setOpenId} />}
    </div>
  );
}
