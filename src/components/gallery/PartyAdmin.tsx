"use client";

import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { ArrowClockwise, Copy, DownloadSimple, Eye, EyeSlash, Trash } from "@phosphor-icons/react";
import {
  challengeTitle,
  partyAdminGet,
  partyAdminSetStatus,
  partyAdminSetWindow,
  photoUrl,
  thumbUrl,
  type AdminPartyPhoto,
  type AdminSnapshot,
  type PartyStatus,
} from "@/data/party";
import { createZip, type ZipEntry } from "@/lib/zip";

type Tab = "visible" | "hidden" | "removed" | "souvenir";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "visible", label: "Visibles" },
  { id: "souvenir", label: "Souvenirs" },
  { id: "hidden", label: "Masquées" },
  { id: "removed", label: "Retirées" },
];
const REFRESH_MS = 20_000;
const BTN = "border-2 border-childhood-ink px-3 py-2 text-sm font-semibold disabled:opacity-50";

const stamp = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** ISO > valeur d'un champ datetime-local (heure locale). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const inTab = (photo: AdminPartyPhoto, tab: Tab) =>
  tab === "visible" ? photo.status === "approved" && photo.kind === "soiree"
  : tab === "souvenir" ? photo.status === "approved" && photo.kind === "souvenir"
  : tab === "hidden" ? photo.status === "hidden"
  : photo.status === "removed";

function LinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copie ce lien:", url);
    }
  };
  return (
    <li className="flex flex-wrap items-center gap-3">
      <span className="w-44 font-semibold">{label}</span>
      <code className="min-w-0 flex-1 break-all bg-white/60 px-2 py-1 text-sm">{url}</code>
      <button type="button" onClick={() => void copy()} className={`${BTN} flex items-center gap-2`}>
        <Copy size={16} aria-hidden="true" /> {copied ? "Copié" : "Copier"}
      </button>
    </li>
  );
}

/** Tableau de bord de la galerie: liens, fenêtre d'ouverture, masquage, export. Réservé à l'organisateur. */
export function PartyAdmin() {
  const fieldId = useId();
  const [secret, setSecret] = useState("");
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>("visible");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [origin, setOrigin] = useState("");

  const load = useCallback(async (value: string, silent = false) => {
    if (!silent) setBusy(true);
    const result = await partyAdminGet(value);
    if (!silent) setBusy(false);
    if (!result.ok) {
      if (!silent) {
        setSnapshot(null);
        setError(result.code === "key" ? "Secret incorrect, ou trop d'essais récents. Patiente dix minutes." : result.message);
      }
      return;
    }
    setError(null);
    setSnapshot(result.data);
  }, []);

  // Après connexion: adresse du site, fenêtre actuelle et actualisation régulière.
  const signedIn = snapshot !== null;
  useEffect(() => {
    if (!signedIn) return;
    const timer = window.setInterval(() => void load(secret, true), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [signedIn, secret, load]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!secret.trim()) return;
    setSecret(secret.trim());
    await load(secret.trim());
    setOrigin(window.location.origin);
  };

  // Réaligne les champs de la fenêtre sur la valeur enregistrée (ajustement pendant le rendu, pas dans un effet).
  const [syncedWindow, setSyncedWindow] = useState<string | null>(null);
  const windowKey = snapshot ? `${snapshot.openFrom}|${snapshot.openUntil}` : null;
  if (windowKey !== syncedWindow) {
    setSyncedWindow(windowKey);
    if (snapshot) {
      setFrom(toLocalInput(snapshot.openFrom));
      setUntil(toLocalInput(snapshot.openUntil));
    }
  }

  const decide = async (id: string, status: PartyStatus) => {
    setBusy(true);
    const result = await partyAdminSetStatus(secret, id, status);
    if (!result.ok) setError(result.message);
    await load(secret, true);
    setBusy(false);
  };

  const saveWindow = async (open: boolean) => {
    setBusy(true);
    const result = await partyAdminSetWindow(
      secret,
      open && from ? new Date(from).toISOString() : null,
      open && until ? new Date(until).toISOString() : null,
    );
    if (!result.ok) setError(result.message);
    await load(secret, true);
    setBusy(false);
  };

  const counts = useMemo(() => {
    const rows = snapshot?.rows ?? [];
    const authors = new Set(rows.filter((row) => row.status === "approved" && row.author_name).map((row) => row.author_name));
    return {
      visible: rows.filter((row) => inTab(row, "visible")).length,
      souvenir: rows.filter((row) => inTab(row, "souvenir")).length,
      hidden: rows.filter((row) => inTab(row, "hidden")).length,
      removed: rows.filter((row) => inTab(row, "removed")).length,
      authors: authors.size,
      hearts: rows.filter((row) => row.status === "approved").reduce((sum, row) => sum + row.hearts, 0),
    };
  }, [snapshot]);

  const downloadZip = async (kind: "soiree" | "souvenir") => {
    if (!snapshot) return;
    const rows = snapshot.rows.filter((row) => row.status === "approved" && row.kind === kind);
    if (rows.length === 0) return;
    const entries: ZipEntry[] = [];
    try {
      for (const [index, row] of rows.entries()) {
        setZipping(`${index + 1} / ${rows.length}`);
        const response = await fetch(photoUrl(row.id));
        if (!response.ok) continue;
        const data = new Uint8Array(await response.arrayBuffer());
        const who = (row.author_name ?? "invite").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 24);
        const day = row.created_at.slice(0, 10);
        entries.push({ name: `${kind === "soiree" ? "soiree" : "souvenirs"}/${day}_${who}_${row.id.slice(0, 8)}.jpg`, data, date: new Date(row.created_at) });
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(createZip(entries));
      link.download = kind === "soiree" ? "photos-soiree-laura.zip" : "souvenirs-laura.zip";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
    } catch {
      setError("Le téléchargement a échoué. Réessaie.");
    }
    setZipping(null);
  };

  if (!snapshot) {
    return (
      <form onSubmit={(event) => void onSubmit(event)} className="flex max-w-[28rem] flex-col gap-4">
        <label htmlFor={fieldId} className="font-semibold">Secret de modération</label>
        <input id={fieldId} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="off" className="border-2 border-current bg-white/70 px-4 py-3 text-lg text-childhood-ink" />
        {error && <p role="alert" className="font-semibold text-mischief-secondary">{error}</p>}
        <button type="submit" disabled={busy} className="w-fit bg-childhood-ink px-6 py-3 font-semibold text-childhood-background disabled:opacity-60">
          {busy ? "Vérification..." : "Entrer"}
        </button>
      </form>
    );
  }

  const base = origin || window.location.origin;
  const withKey = (path: string, extra = "") => `${base}${path}?k=${snapshot.key}${extra}`;
  const visible = snapshot.rows.filter((row) => inTab(row, tab));

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="stats">
        <h2 id="stats" className="display text-3xl">EN CE MOMENT</h2>
        <p className="mt-4 text-lg">
          <strong>{counts.visible}</strong> {counts.visible > 1 ? "photos" : "photo"} de la soirée, <strong>{counts.souvenir}</strong> {counts.souvenir > 1 ? "souvenirs" : "souvenir"}, <strong>{counts.authors}</strong> {counts.authors > 1 ? "invités identifiés" : "invité identifié"}, <strong>{counts.hearts}</strong> {counts.hearts > 1 ? "cœurs" : "cœur"}.
          {counts.hidden > 0 && <> {counts.hidden} masquée{counts.hidden > 1 ? "s" : ""}.</>}
        </p>
      </section>

      <section aria-labelledby="links">
        <h2 id="links" className="display text-3xl">LES LIENS</h2>
        <p className="mt-3 max-w-[60ch]">Ces liens contiennent la clé de la soirée: ne les publie pas en ligne. Le QR code est généré avec <code>npm run qr</code>.</p>
        <ul className="mt-5 flex flex-col gap-3">
          <LinkRow label="Envoi (QR code)" url={withKey("/photos")} />
          <LinkRow label="Galerie" url={withKey("/galerie")} />
          <LinkRow label="Écran géant (live)" url={withKey("/projection/live")} />
          <LinkRow label="Diaporama" url={withKey("/galerie/diaporama")} />
          <LinkRow label="Souvenirs d'avant" url={withKey("/photos", "&mode=souvenirs")} />
        </ul>
      </section>

      <section aria-labelledby="window">
        <h2 id="window" className="display text-3xl">OUVERTURE DES ENVOIS</h2>
        <p className="mt-3 max-w-[60ch]">
          {snapshot.openFrom || snapshot.openUntil ? "Les envois de la soirée ne sont acceptés que dans cette période." : "Aucune limite: les envois de la soirée sont ouverts en permanence."} Les souvenirs ne sont jamais limités.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 font-semibold">Ouvre le
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="border-2 border-current bg-white/70 px-3 py-2 font-normal" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">Ferme le
            <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} className="border-2 border-current bg-white/70 px-3 py-2 font-normal" />
          </label>
          <button type="button" disabled={busy || (!from && !until)} onClick={() => void saveWindow(true)} className="bg-childhood-ink px-5 py-3 font-semibold text-childhood-background disabled:opacity-50">Enregistrer</button>
          <button type="button" disabled={busy} onClick={() => void saveWindow(false)} className={BTN}>Ouvrir sans limite</button>
        </div>
      </section>

      <section aria-labelledby="export">
        <h2 id="export" className="display text-3xl">TOUT RÉCUPÉRER</h2>
        <p className="mt-3 max-w-[60ch]">Archive ZIP des photos approuvées (à la qualité envoyée, 2000 px). Les souvenirs peuvent ensuite être copiés dans le dossier <code>photos/</code> du site pour nourrir les univers.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="button" disabled={zipping !== null || counts.visible === 0} onClick={() => void downloadZip("soiree")} className={`${BTN} flex items-center gap-2`}>
            <DownloadSimple size={18} aria-hidden="true" /> Photos de la soirée ({counts.visible})
          </button>
          <button type="button" disabled={zipping !== null || counts.souvenir === 0} onClick={() => void downloadZip("souvenir")} className={`${BTN} flex items-center gap-2`}>
            <DownloadSimple size={18} aria-hidden="true" /> Souvenirs ({counts.souvenir})
          </button>
          {zipping && <p role="status" className="mono">Téléchargement {zipping}...</p>}
        </div>
      </section>

      <section aria-labelledby="moderate">
        <h2 id="moderate" className="display text-3xl">MODÉRATION</h2>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {TABS.map((item) => (
            <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={`border-2 border-childhood-ink px-4 py-2 font-semibold ${tab === item.id ? "bg-childhood-ink text-childhood-background" : ""}`}>
              {item.label} ({counts[item.id]})
            </button>
          ))}
          <button type="button" onClick={() => void load(secret)} disabled={busy} aria-label="Actualiser" className="border-2 border-childhood-ink p-2">
            <ArrowClockwise size={20} aria-hidden="true" />
          </button>
        </div>
        {error && <p role="alert" className="mt-4 font-semibold text-mischief-secondary">{error}</p>}
        {visible.length === 0 ? (
          <p className="mt-8 text-lg">Rien dans cette liste.</p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {visible.map((photo) => (
              <li key={photo.id} className="border-2 border-childhood-ink bg-white/70">
                {/* eslint-disable-next-line @next/next/no-img-element -- miniature du stockage, déjà réduite */}
                <img src={thumbUrl(photo.id)} alt={photo.caption ?? "Photo envoyée"} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="p-2 text-sm">
                  <p className="font-semibold">{photo.author_name ?? "Anonyme"} <span className="font-normal opacity-70">/ {stamp(photo.created_at)}</span></p>
                  {photo.caption && <p className="mt-1 line-clamp-2">{photo.caption}</p>}
                  <p className="mono mt-1 opacity-70">{[challengeTitle(photo.challenge), photo.year, photo.hearts > 0 ? `${photo.hearts} ♥` : null].filter(Boolean).join(" / ")}</p>
                  <div className="mt-2 flex gap-2">
                    {photo.status === "approved" ? (
                      <button type="button" disabled={busy} onClick={() => void decide(photo.id, "hidden")} aria-label="Masquer cette photo" className={`${BTN} flex items-center gap-1`}><EyeSlash size={16} aria-hidden="true" /> Masquer</button>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => void decide(photo.id, "approved")} aria-label="Rétablir cette photo" className={`${BTN} flex items-center gap-1`}><Eye size={16} aria-hidden="true" /> Rétablir</button>
                    )}
                    {photo.status !== "removed" && (
                      <button type="button" disabled={busy} onClick={() => void decide(photo.id, "removed")} aria-label="Supprimer cette photo de la galerie" className={`${BTN} px-2`}><Trash size={16} aria-hidden="true" /></button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
