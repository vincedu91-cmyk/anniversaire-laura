"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { heartedIds, partyHeart, partyList, resolvePartyKey, storeHearted, type PartyPhoto } from "@/data/party";

const noop = () => () => undefined;

/** Clé du QR code: undefined pendant l'hydratation, null si absente. */
export function usePartyKey(): string | null | undefined {
  return useSyncExternalStore(noop, resolvePartyKey, () => undefined);
}

export type GalleryStatus = "loading" | "ready" | "offline" | "denied";

const OVERLAP_MS = 3000; // recouvrement entre deux synchronisations: aucun changement ne peut passer entre deux
const ERROR_RETRY_MS = 6000;

export interface PartyGallery {
  key: string | null | undefined;
  status: GalleryStatus;
  /** Photos approuvées, les plus récentes d'abord. */
  photos: readonly PartyPhoto[];
  hearted: ReadonlySet<string>;
  toggleHeart: (id: string) => void;
}

/**
 * Galerie synchronisée par interrogation légère: seules les nouveautés (photos, cœurs, masquages) sont
 * demandées à chaque passage. Reprend toute seule après une coupure, se met en pause onglet masqué.
 */
export function usePartyGallery(pollMs = 8000, onArrivals?: (photos: readonly PartyPhoto[]) => void): PartyGallery {
  const key = usePartyKey();
  const arrivals = useRef(onArrivals);
  useEffect(() => {
    arrivals.current = onArrivals;
  });
  const known = useRef<Set<string>>(new Set());
  const [byId, setById] = useState<ReadonlyMap<string, PartyPhoto>>(() => new Map());
  const [status, setStatus] = useState<GalleryStatus>("loading");
  const [hearted, setHearted] = useState<ReadonlySet<string>>(() => new Set(heartedIds()));
  const since = useRef<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let timeout: number | undefined;

    const schedule = (delay: number) => {
      if (!cancelled) timeout = window.setTimeout(tick, delay);
    };

    async function tick() {
      if (document.hidden) return schedule(pollMs);
      const result = await partyList(key as string, since.current);
      if (cancelled) return;
      if (!result.ok) {
        setStatus((previous) => (result.code === "key" ? "denied" : previous === "ready" ? previous : "offline"));
        return result.code === "key" ? undefined : schedule(ERROR_RETRY_MS);
      }
      const firstLoad = since.current === null;
      since.current = new Date(Date.parse(result.data.serverNow) - OVERLAP_MS).toISOString();
      // Nouvelles photos (hors premier chargement): utile au mur live, qui les met en scène à leur arrivée.
      const fresh = result.data.rows.filter((row): row is PartyPhoto & { status: "approved" } => row.status === "approved" && !known.current.has(row.id));
      for (const row of fresh) known.current.add(row.id);
      if (!firstLoad && fresh.length > 0) arrivals.current?.([...fresh].sort((a, b) => (a.created_at < b.created_at ? -1 : 1)));
      if (result.data.rows.length > 0) {
        setById((previous) => {
          const next = new Map(previous);
          for (const row of result.data.rows) {
            if (row.status === "approved") next.set(row.id, row);
            else next.delete(row.id);
          }
          return next;
        });
      }
      setStatus("ready");
      schedule(pollMs);
    }

    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [key, pollMs]);

  const photos = useMemo(
    () => [...byId.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0)),
    [byId],
  );

  const toggleHeart = useCallback(
    (id: string) => {
      if (!key) return;
      const wasHearted = hearted.has(id);
      const apply = (isHearted: boolean, hearts: number | null) => {
        setHearted((previous) => {
          const next = new Set(previous);
          if (isHearted) next.add(id);
          else next.delete(id);
          storeHearted([...next]);
          return next;
        });
        setById((previous) => {
          const photo = previous.get(id);
          if (!photo) return previous;
          const next = new Map(previous);
          next.set(id, { ...photo, hearts: hearts ?? Math.max(0, photo.hearts + (isHearted ? 1 : -1)) });
          return next;
        });
      };
      apply(!wasHearted, null); // immédiat, puis on aligne sur la réponse du serveur
      void partyHeart(key, id).then((result) => {
        if (result.ok) apply(result.data.hearted, result.data.hearts);
        else apply(wasHearted, null);
      });
    },
    [hearted, key],
  );

  return { key, status, photos, hearted, toggleHeart };
}
