"use client";

import { useCallback, useId, useMemo, useState, type FormEvent } from "react";
import { Check, X, ArrowUUpLeft, ArrowClockwise } from "@phosphor-icons/react";
import { audioUrl, moderationList, moderationSetStatus, type MessageStatus, type ModeratedMessage } from "@/data/guestbook";

const TABS: readonly { id: MessageStatus; label: string }[] = [
  { id: "pending", label: "À relire" },
  { id: "approved", label: "Approuvés" },
  { id: "rejected", label: "Refusés" },
];

const stamp = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** Tableau de modération: seul le détenteur du secret voit les messages en attente. */
export function ModerationBoard() {
  const fieldId = useId();
  const [secret, setSecret] = useState("");
  const [rows, setRows] = useState<ModeratedMessage[] | null>(null);
  const [tab, setTab] = useState<MessageStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (value: string) => {
    setSecret(value);
    setBusy(true);
    setError(null);
    const result = await moderationList(value);
    setBusy(false);
    if (!result.ok) {
      setRows(null);
      setError(result.error);
      return;
    }
    setRows(result.data);
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (secret.trim()) void load(secret.trim());
  };

  const decide = async (id: string, status: MessageStatus) => {
    setBusy(true);
    const result = await moderationSetStatus(secret, id, status);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    await load(secret);
  };

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, rows?.filter((r) => r.status === t.id).length ?? 0])) as Record<MessageStatus, number>,
    [rows],
  );
  const visible = rows?.filter((row) => row.status === tab) ?? [];

  if (!rows) {
    return (
      <form onSubmit={onSubmit} className="flex max-w-[28rem] flex-col gap-4">
        <label htmlFor={fieldId} className="font-semibold">Secret de modération</label>
        <input id={fieldId} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="off" className="border-2 border-current bg-white/70 px-4 py-3 text-lg text-childhood-ink" />
        {error && <p role="alert" className="font-semibold text-mischief-secondary">{error}</p>}
        <button type="submit" disabled={busy} className="w-fit bg-childhood-ink px-6 py-3 font-semibold text-childhood-background disabled:opacity-60">
          {busy ? "Vérification..." : "Entrer"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {TABS.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)} className={`border-2 border-childhood-ink px-4 py-2 font-semibold ${tab === t.id ? "bg-childhood-ink text-childhood-background" : ""}`}>
            {t.label} ({counts[t.id]})
          </button>
        ))}
        <button type="button" onClick={() => void load(secret)} disabled={busy} aria-label="Actualiser" className="border-2 border-childhood-ink p-2">
          <ArrowClockwise size={20} aria-hidden="true" />
        </button>
      </div>
      {error && <p role="alert" className="mt-4 font-semibold text-mischief-secondary">{error}</p>}

      {visible.length === 0 ? (
        <p className="mt-10 text-lg">Rien dans cette liste.</p>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {visible.map((row) => (
            <li key={row.id} className="border-2 border-childhood-ink bg-white/70 p-5">
              <p className="mono">{row.author_name} / {stamp(row.created_at)}</p>
              {row.kind === "text" ? (
                <p className="mt-3 whitespace-pre-wrap text-lg">{row.body}</p>
              ) : (
                <audio controls preload="none" src={row.audio_path ? (audioUrl(row.audio_path) ?? undefined) : undefined} className="mt-3 w-full" aria-label={`Message vocal de ${row.author_name}`} />
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                {row.status !== "approved" && (
                  <button type="button" disabled={busy} onClick={() => void decide(row.id, "approved")} className="flex items-center gap-2 bg-mischief-green px-4 py-2 font-semibold text-mischief-ink">
                    <Check size={18} weight="bold" aria-hidden="true" /> Approuver
                  </button>
                )}
                {row.status !== "rejected" && (
                  <button type="button" disabled={busy} onClick={() => void decide(row.id, "rejected")} className="flex items-center gap-2 bg-mischief-secondary px-4 py-2 font-semibold text-mischief-paper">
                    <X size={18} weight="bold" aria-hidden="true" /> Refuser
                  </button>
                )}
                {row.status !== "pending" && (
                  <button type="button" disabled={busy} onClick={() => void decide(row.id, "pending")} className="flex items-center gap-2 border-2 border-childhood-ink px-4 py-2 font-semibold">
                    <ArrowUUpLeft size={18} aria-hidden="true" /> Remettre à relire
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
