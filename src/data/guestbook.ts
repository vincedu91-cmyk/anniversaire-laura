import { getSupabase } from "@/lib/supabase";

export type MessageKind = "text" | "voice";
export type MessageStatus = "pending" | "approved" | "rejected";

export interface GuestbookMessage {
  id: string;
  created_at: string;
  author_name: string;
  kind: MessageKind;
  body: string | null;
  audio_path: string | null;
  audio_seconds: number | null;
}

export interface ModeratedMessage extends GuestbookMessage {
  status: MessageStatus;
  reviewed_at: string | null;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const AUDIO_BUCKET = "guestbook-audio";
export const MAX_NAME = 60;
export const MAX_TEXT = 1200;
export const MAX_VOICE_SECONDS = 60;
const MAX_DISPLAYED = 200;

const UNAVAILABLE = "Le livre d'or n'est pas disponible pour le moment.";
const GENERIC = "Une erreur est survenue. Réessaie dans un instant.";

const PUBLIC_COLUMNS = "id, created_at, author_name, kind, body, audio_path, audio_seconds";

/** Lecture seule: ne renvoie que les messages approuvés (et révélés), par ordre d'arrivée. */
export async function fetchApprovedMessages(): Promise<Result<GuestbookMessage[]>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: UNAVAILABLE };
  const { data, error } = await supabase
    .from("guestbook_messages")
    .select(PUBLIC_COLUMNS)
    .order("created_at", { ascending: true })
    .limit(MAX_DISPLAYED);
  if (error) return { ok: false, error: GENERIC };
  return { ok: true, data: (data ?? []) as GuestbookMessage[] };
}

export function audioUrl(path: string): string | null {
  const supabase = getSupabase();
  return supabase ? supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl : null;
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
}

export async function submitTextMessage(input: { name: string; body: string }): Promise<Result<null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: UNAVAILABLE };
  const author_name = cleanName(input.name);
  const body = input.body.trim();
  if (!author_name) return { ok: false, error: "Indique ton prénom." };
  if (!body) return { ok: false, error: "Écris ton message." };
  if (body.length > MAX_TEXT) return { ok: false, error: `Ton message dépasse ${MAX_TEXT} caractères.` };
  const { error } = await supabase.from("guestbook_messages").insert({ author_name, kind: "text", body });
  return error ? { ok: false, error: GENERIC } : { ok: true, data: null };
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

export async function submitVoiceMessage(input: { name: string; blob: Blob; seconds: number }): Promise<Result<null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: UNAVAILABLE };
  const author_name = cleanName(input.name);
  if (!author_name) return { ok: false, error: "Indique ton prénom." };
  const seconds = Math.min(90, Math.max(1, Math.round(input.seconds)));
  // Le type MIME doit être sans paramètres ("audio/webm", pas "audio/webm;codecs=opus").
  const baseMime = input.blob.type.split(";")[0] || "audio/webm";
  const path = `${crypto.randomUUID()}.${extensionFor(baseMime)}`;

  const upload = await supabase.storage.from(AUDIO_BUCKET).upload(path, input.blob, { contentType: baseMime, upsert: false });
  if (upload.error) return { ok: false, error: GENERIC };
  const { error } = await supabase
    .from("guestbook_messages")
    .insert({ author_name, kind: "voice", audio_path: path, audio_seconds: seconds });
  return error ? { ok: false, error: GENERIC } : { ok: true, data: null };
}

// Modération: fonctions SQL protégées par un secret (voir supabase/migrations).

interface RpcOk<T> {
  ok: boolean;
  rows?: T;
}

export async function moderationList(secret: string): Promise<Result<ModeratedMessage[]>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: UNAVAILABLE };
  const { data, error } = await supabase.rpc("moderation_list", { p_secret: secret });
  if (error) return { ok: false, error: GENERIC };
  const payload = data as RpcOk<ModeratedMessage[]>;
  if (!payload.ok) return { ok: false, error: "Secret incorrect, ou trop d'essais récents. Patiente dix minutes." };
  return { ok: true, data: payload.rows ?? [] };
}

export async function moderationSetStatus(secret: string, id: string, status: MessageStatus): Promise<Result<null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: UNAVAILABLE };
  const { data, error } = await supabase.rpc("moderation_set_status", { p_secret: secret, p_id: id, p_status: status });
  if (error || !(data as RpcOk<never>).ok) return { ok: false, error: GENERIC };
  return { ok: true, data: null };
}
