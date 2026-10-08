import { getSupabase } from "@/lib/supabase";
import event from "./event.json";
import type { Result } from "./guestbook";

export type RsvpStatus = "pending" | "yes" | "maybe" | "no";
export type Answer = Exclude<RsvpStatus, "pending">;

export interface Guest {
  id: string;
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  status: RsvpStatus;
  responded_at: string | null;
  created_at: string;
}

export interface GuestSummary {
  first_name: string;
  status: RsvpStatus;
  responded_at: string | null;
}

export interface ImportReport {
  added: number;
  duplicates: number;
  invalid: number;
}

export interface GuestDraft {
  first_name: string;
  last_name: string;
  email: string;
}

export const STATUS_LABEL: Record<RsvpStatus, string> = {
  pending: "Sans réponse",
  yes: "Présent(e)",
  maybe: "Peut-être",
  no: "Absent(e)",
};

export const eventInfo = event;

const UNAVAILABLE = "Le service d'invitations n'est pas disponible pour le moment.";
const GENERIC = "Une erreur est survenue. Réessaie dans un instant.";
const BAD_SECRET = "Secret incorrect, ou trop d'essais récents. Patiente dix minutes.";

type Payload = { ok: boolean; error?: string } & Record<string, unknown>;

async function call(fn: string, args: Record<string, unknown>): Promise<Result<Payload>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: UNAVAILABLE };
  const { data, error } = await supabase.rpc(fn, args);
  if (error || !data) return { ok: false, error: GENERIC };
  return { ok: true, data: data as Payload };
}

// ---- Côté invité

export async function rsvpGet(token: string): Promise<Result<GuestSummary | null>> {
  const result = await call("rsvp_get", { p_token: token });
  if (!result.ok) return result;
  if (!result.data.ok) return { ok: true, data: null };
  const { first_name, status, responded_at } = result.data as unknown as GuestSummary;
  return { ok: true, data: { first_name, status, responded_at } };
}

export async function rsvpRespond(token: string, status: Answer): Promise<Result<null>> {
  const result = await call("rsvp_respond", { p_token: token, p_status: status });
  if (!result.ok) return result;
  return result.data.ok ? { ok: true, data: null } : { ok: false, error: GENERIC };
}

// ---- Côté organisateur

export async function adminList(secret: string): Promise<Result<Guest[]>> {
  const result = await call("admin_guests_list", { p_secret: secret });
  if (!result.ok) return result;
  if (!result.data.ok) return { ok: false, error: BAD_SECRET };
  return { ok: true, data: (result.data.rows as Guest[]) ?? [] };
}

const SAVE_ERRORS: Record<string, string> = {
  duplicate: "Cette adresse e-mail est déjà dans la liste.",
  invalid: "Prénom ou adresse e-mail invalide.",
  secret: BAD_SECRET,
};

export async function adminSave(secret: string, id: string | null, draft: GuestDraft): Promise<Result<null>> {
  const result = await call("admin_guest_save", {
    p_secret: secret,
    p_id: id,
    p_first_name: draft.first_name,
    p_last_name: draft.last_name,
    p_email: draft.email,
  });
  if (!result.ok) return result;
  return result.data.ok ? { ok: true, data: null } : { ok: false, error: SAVE_ERRORS[result.data.error ?? ""] ?? GENERIC };
}

export async function adminSetStatus(secret: string, id: string, status: RsvpStatus): Promise<Result<null>> {
  const result = await call("admin_guest_set_status", { p_secret: secret, p_id: id, p_status: status });
  if (!result.ok) return result;
  return result.data.ok ? { ok: true, data: null } : { ok: false, error: GENERIC };
}

export async function adminDelete(secret: string, id: string): Promise<Result<null>> {
  const result = await call("admin_guest_delete", { p_secret: secret, p_id: id });
  if (!result.ok) return result;
  return result.data.ok ? { ok: true, data: null } : { ok: false, error: GENERIC };
}

export async function adminImport(secret: string, rows: GuestDraft[]): Promise<Result<ImportReport>> {
  const result = await call("admin_guests_import", { p_secret: secret, p_rows: rows });
  if (!result.ok) return result;
  if (!result.data.ok) return { ok: false, error: GENERIC };
  const { added, duplicates, invalid } = result.data as unknown as ImportReport;
  return { ok: true, data: { added, duplicates, invalid } };
}

// ---- Outils (purs, testables)

/** Lien personnel envoyé à l'invité. Le jeton ne contient que des caractères sûrs pour une URL. */
export function guestLink(token: string, base: string = event.siteUrl): string {
  return `${base.replace(/\/$/, "")}/invitation?c=${encodeURIComponent(token)}`;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Lit des lignes collées depuis un tableur: "Prénom;Nom;email", "Prénom Nom, email", etc.
 * Séparateurs acceptés: point-virgule, virgule, tabulation. Les lignes sans e-mail valide sont signalées.
 */
export function parseGuestLines(text: string): { rows: GuestDraft[]; rejected: string[] } {
  const rows: GuestDraft[] = [];
  const rejected: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cells = line.split(/[;,\t]/).map((cell) => cell.trim()).filter(Boolean);
    const email = cells.find((cell) => cell.includes("@"));
    if (!email) {
      // En-tête probable ("prénom;nom;email"): ignoré sans bruit.
      if (!/mail/i.test(line)) rejected.push(line);
      continue;
    }
    if (!EMAIL.test(email)) {
      rejected.push(line);
      continue;
    }
    const names = cells.filter((cell) => cell !== email);
    const [first = "", ...rest] = names.length === 1 ? names[0].split(/\s+/) : names;
    rows.push({ first_name: first, last_name: rest.join(" "), email });
  }
  return { rows, rejected };
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/** CSV prêt pour un publipostage (séparateur ";" et BOM pour Excel français). */
export function toMergeCsv(guests: readonly Guest[], base?: string): string {
  const header = ["prenom", "nom", "email", "lien", "reponse"].join(";");
  const lines = guests.map((guest) =>
    [guest.first_name, guest.last_name, guest.email, guestLink(guest.token, base), STATUS_LABEL[guest.status]].map(csvCell).join(";"),
  );
  return `﻿${[header, ...lines].join("\r\n")}`;
}

export function countByStatus(guests: readonly Guest[]): Record<RsvpStatus | "all", number> {
  const counts = { all: guests.length, pending: 0, yes: 0, maybe: 0, no: 0 };
  for (const guest of guests) counts[guest.status] += 1;
  return counts;
}
