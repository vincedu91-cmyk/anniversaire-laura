"use client";

import { useId, useState, type FormEvent } from "react";
import { parseGuestLines, type Guest, type GuestDraft, type ImportReport } from "@/data/rsvp";

const FIELD = "w-full border-2 border-childhood-ink bg-white/70 px-3 py-2 text-base text-childhood-ink";
const BUTTON = "border-2 border-childhood-ink px-4 py-2 font-semibold transition-transform duration-(--motion-fast) active:scale-[0.97] disabled:opacity-60";

interface GuestEditorProps {
  /** Invité en cours de modification (null = ajout). */
  editing: Guest | null;
  busy: boolean;
  onSave: (draft: GuestDraft) => Promise<boolean>;
  onCancel: () => void;
  onImport: (rows: GuestDraft[]) => Promise<ImportReport | null>;
}

/** Ajout / modification d'un invité, et import en masse depuis un tableur (copier-coller). */
export function GuestEditor({ editing, busy, onSave, onCancel, onImport }: GuestEditorProps) {
  const ids = { first: useId(), last: useId(), email: useId(), paste: useId() };
  // Le parent remonte ce composant (key) quand on change d'invité: l'état initial suffit.
  const [draft, setDraft] = useState<GuestDraft>(() =>
    editing ? { first_name: editing.first_name, last_name: editing.last_name, email: editing.email } : { first_name: "", last_name: "", email: "" },
  );
  const [paste, setPaste] = useState("");
  const [report, setReport] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave(draft)) setDraft({ first_name: "", last_name: "", email: "" });
  };

  const importPasted = async () => {
    const { rows, rejected } = parseGuestLines(paste);
    if (rows.length === 0) {
      setReport(rejected.length ? `Aucune ligne valide. À vérifier : ${rejected.slice(0, 3).join(" / ")}` : "Colle d'abord des lignes (Prénom;Nom;e-mail).");
      return;
    }
    const result = await onImport(rows);
    if (!result) return;
    const notes = [`${result.added} ajouté(s)`];
    if (result.duplicates) notes.push(`${result.duplicates} déjà présent(s)`);
    if (result.invalid + rejected.length) notes.push(`${result.invalid + rejected.length} ligne(s) ignorée(s)`);
    setReport(notes.join(", "));
    setPaste("");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={submit} className="border-2 border-childhood-ink bg-white/60 p-5" aria-label={editing ? "Modifier un invité" : "Ajouter un invité"}>
        <h2 className="font-bold text-xl">{editing ? `Modifier ${editing.first_name}` : "Ajouter un invité"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.first} className="font-semibold">Prénom</label>
            <input id={ids.first} required maxLength={60} value={draft.first_name} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} className={FIELD} />
          </div>
          <div>
            <label htmlFor={ids.last} className="font-semibold">Nom</label>
            <input id={ids.last} maxLength={60} value={draft.last_name} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} className={FIELD} />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor={ids.email} className="font-semibold">Adresse e-mail</label>
          <input id={ids.email} type="email" required maxLength={160} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={FIELD} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className={`${BUTTON} bg-childhood-ink text-childhood-background`}>{editing ? "Enregistrer" : "Ajouter"}</button>
          {editing && <button type="button" onClick={onCancel} className={BUTTON}>Annuler</button>}
        </div>
      </form>

      <div className="border-2 border-childhood-ink bg-white/60 p-5">
        <h2 className="font-bold text-xl">Importer une liste</h2>
        <p className="mt-2">Une ligne par invité : <span className="mono">Prénom;Nom;e-mail</span> (copié depuis Excel ou Sheets, les doublons sont ignorés).</p>
        <label htmlFor={ids.paste} className="sr-only">Liste des invités à importer</label>
        <textarea id={ids.paste} rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} className={`${FIELD} mt-3 font-mono text-sm`} placeholder={"Camille;Martin;camille@exemple.fr"} />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="button" disabled={busy || !paste.trim()} onClick={() => void importPasted()} className={`${BUTTON} bg-childhood-ink text-childhood-background`}>Importer</button>
          {report && <p role="status" className="font-semibold">{report}</p>}
        </div>
      </div>
    </div>
  );
}
