"use client";

import { useCallback, useId, useMemo, useState, type FormEvent } from "react";
import { ArrowClockwise, Copy, DownloadSimple, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  STATUS_LABEL,
  adminDelete,
  adminImport,
  adminList,
  adminSave,
  adminSetStatus,
  countByStatus,
  guestLink,
  toMergeCsv,
  type Guest,
  type GuestDraft,
  type ImportReport,
  type RsvpStatus,
} from "@/data/rsvp";
import { GuestEditor } from "./GuestEditor";

type Filter = RsvpStatus | "all";

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "Invités" },
  { id: "yes", label: "Présents" },
  { id: "maybe", label: "Peut-être" },
  { id: "no", label: "Absents" },
  { id: "pending", label: "Sans réponse" },
];

const BADGE: Record<RsvpStatus, string> = {
  pending: "bg-white text-childhood-ink",
  yes: "bg-mischief-green text-mischief-ink",
  maybe: "bg-mischief-primary text-mischief-ink",
  no: "bg-mischief-secondary text-mischief-paper",
};

const BUTTON = "flex items-center gap-2 border-2 border-childhood-ink px-3 py-2 font-semibold transition-transform duration-(--motion-fast) active:scale-[0.97] disabled:opacity-60";

const shortDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Gestion complète des invitations: liste, réponses, ajout, import, liens personnels, export publipostage. */
export function GuestAdmin() {
  const fieldId = useId();
  const [secret, setSecret] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async (value: string) => {
    setBusy(true);
    const result = await adminList(value);
    setBusy(false);
    if (!result.ok) {
      setGuests(null);
      setError(result.error);
      return false;
    }
    setError(null);
    setGuests(result.data);
    return true;
  }, []);

  const login = (event: FormEvent) => {
    event.preventDefault();
    if (secret.trim()) void refresh(secret.trim());
  };

  const counts = useMemo(() => countByStatus(guests ?? []), [guests]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (guests ?? []).filter(
      (guest) =>
        (filter === "all" || guest.status === filter) &&
        (!needle || `${guest.first_name} ${guest.last_name} ${guest.email}`.toLowerCase().includes(needle)),
    );
  }, [guests, filter, query]);

  /** Exécute une action puis recharge la liste; affiche l'erreur éventuelle. */
  const act = async (action: () => Promise<{ ok: boolean; error?: string }>): Promise<boolean> => {
    setBusy(true);
    setNotice(null);
    const result = await action();
    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "Une erreur est survenue.");
      return false;
    }
    return refresh(secret);
  };

  const save = (draft: GuestDraft) =>
    act(() => adminSave(secret, editing?.id ?? null, draft)).then((ok) => {
      if (ok) {
        setNotice(editing ? "Invité modifié." : "Invité ajouté.");
        setEditing(null);
      }
      return ok;
    });

  const importRows = async (rows: GuestDraft[]): Promise<ImportReport | null> => {
    setBusy(true);
    const result = await adminImport(secret, rows);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return null;
    }
    await refresh(secret);
    return result.data;
  };

  const remove = (guest: Guest) => {
    if (!window.confirm(`Supprimer ${guest.first_name} ${guest.last_name} de la liste ? Son lien ne fonctionnera plus.`)) return;
    void act(() => adminDelete(secret, guest.id)).then((ok) => ok && setNotice("Invité supprimé."));
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(message);
    } catch {
      window.prompt("Copie ce texte :", text);
    }
  };

  if (!guests) {
    return (
      <form onSubmit={login} className="flex max-w-[28rem] flex-col gap-4">
        <label htmlFor={fieldId} className="font-semibold">Secret d&apos;administration</label>
        <input id={fieldId} type="password" autoComplete="current-password" value={secret} onChange={(e) => setSecret(e.target.value)} className="border-2 border-current bg-white/70 px-4 py-3 text-lg text-childhood-ink" />
        {error && <p role="alert" className="font-semibold text-mischief-secondary">{error}</p>}
        <button type="submit" disabled={busy} className="w-fit bg-childhood-ink px-6 py-3 font-semibold text-childhood-background disabled:opacity-60">
          {busy ? "Vérification..." : "Entrer"}
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-8">
      <div role="group" aria-label="Filtrer par réponse" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`border-2 border-childhood-ink p-3 text-left ${filter === id ? "bg-childhood-ink text-childhood-background" : "bg-white/60"}`}
          >
            <span className="block text-4xl font-extrabold leading-none tabular-nums">{counts[id]}</span>
            <span className="mono mt-1 block">{label}</span>
          </button>
        ))}
      </div>

      <GuestEditor key={editing?.id ?? "new"} editing={editing} busy={busy} onSave={save} onCancel={() => setEditing(null)} onImport={importRows} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="guest-search">Rechercher un invité</label>
        <input id="guest-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un nom ou un e-mail" className="min-w-[16rem] flex-1 border-2 border-childhood-ink bg-white/70 px-3 py-2 text-base text-childhood-ink" />
        <button type="button" disabled={visible.length === 0} onClick={() => download(`invites-${filter}.csv`, toMergeCsv(visible))} className={BUTTON}>
          <DownloadSimple size={18} aria-hidden="true" /> Exporter pour le publipostage ({visible.length})
        </button>
        <button type="button" disabled={visible.length === 0} onClick={() => void copy(visible.map((g) => g.email).join("; "), `${visible.length} adresse(s) copiée(s).`)} className={BUTTON}>
          <Copy size={18} aria-hidden="true" /> Copier les e-mails
        </button>
        <button type="button" disabled={busy} onClick={() => void refresh(secret)} aria-label="Actualiser la liste" className={BUTTON}>
          <ArrowClockwise size={18} aria-hidden="true" />
        </button>
      </div>

      {error && <p role="alert" className="font-semibold text-mischief-secondary">{error}</p>}
      <p role="status" className="min-h-6 font-semibold">{notice}</p>

      {visible.length === 0 ? (
        <p className="text-lg">{guests.length === 0 ? "Aucun invité pour l'instant : ajoute-en un ou importe ta liste." : "Aucun invité ne correspond."}</p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((guest) => (
            <li key={guest.id} className="grid items-center gap-3 border-2 border-childhood-ink bg-white/60 p-4 md:grid-cols-[1.2fr_1.4fr_auto_auto]">
              <div>
                <p className="text-lg font-bold">{guest.first_name} {guest.last_name}</p>
                <p className="mono break-all normal-case">{guest.email}</p>
              </div>
              <p className="flex flex-wrap items-center gap-3">
                <span className={`border-2 border-childhood-ink px-3 py-1 font-bold ${BADGE[guest.status]}`}>{STATUS_LABEL[guest.status]}</span>
                {guest.responded_at && <span className="mono">{shortDate(guest.responded_at)}</span>}
              </p>
              <div>
                <label className="sr-only" htmlFor={`status-${guest.id}`}>Réponse de {guest.first_name}</label>
                <select
                  id={`status-${guest.id}`}
                  value={guest.status}
                  disabled={busy}
                  onChange={(e) => void act(() => adminSetStatus(secret, guest.id, e.target.value as RsvpStatus))}
                  className="border-2 border-childhood-ink bg-white px-2 py-2 text-base text-childhood-ink"
                >
                  {(Object.keys(STATUS_LABEL) as RsvpStatus[]).map((status) => (
                    <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void copy(guestLink(guest.token), `Lien de ${guest.first_name} copié.`)} aria-label={`Copier le lien de ${guest.first_name}`} className={BUTTON}>
                  <Copy size={16} aria-hidden="true" /> Lien
                </button>
                <button type="button" onClick={() => { setEditing(guest); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={`Modifier ${guest.first_name}`} className={BUTTON}>
                  <PencilSimple size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => remove(guest)} aria-label={`Supprimer ${guest.first_name}`} className={BUTTON}>
                  <Trash size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
