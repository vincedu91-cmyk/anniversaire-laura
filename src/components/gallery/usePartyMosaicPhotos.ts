"use client";

import { useEffect, useState } from "react";
import { partyList, toSitePhoto } from "@/data/party";
import type { Photo } from "@/data/types";
import { usePartyKey } from "./usePartyGallery";

const MAX_TILES = 59; // nombre de tuiles du "18"

/**
 * Photos de la soirée pour la mosaïque finale, les plus aimées d'abord. Sans clé de la soirée sur cet appareil
 * (visiteur ordinaire), aucune requête n'est faite et la mosaïque reste identique.
 */
export function usePartyMosaicPhotos(): readonly Photo[] {
  const key = usePartyKey();
  const [photos, setPhotos] = useState<readonly Photo[]>([]);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void partyList(key, null).then((result) => {
      if (cancelled || !result.ok) return;
      const approved = result.data.rows.flatMap((row) => (row.status === "approved" && row.kind === "soiree" ? [row] : []));
      approved.sort((a, b) => b.hearts - a.hearts || (a.created_at < b.created_at ? 1 : -1));
      setPhotos(approved.slice(0, MAX_TILES).map(toSitePhoto));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return photos;
}
