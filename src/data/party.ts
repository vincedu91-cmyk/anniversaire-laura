import { getSupabase } from "@/lib/supabase";
import type { Photo } from "./types";

// Galerie collaborative de la soirée: voir supabase/migrations/20261009000000_party_photos.sql.
// Tout passe par des fonctions SQL protégées par la clé du QR code (jamais d'accès direct aux tables).

export type PartyKind = "soiree" | "souvenir";
export type PartyStatus = "approved" | "hidden" | "removed";

export interface PartyPhoto {
  id: string;
  created_at: string;
  updated_at: string;
  kind: PartyKind;
  author_name: string | null;
  caption: string | null;
  challenge: string | null;
  year: number | null;
  width: number | null;
  height: number | null;
  hearts: number;
}

export interface AdminPartyPhoto extends PartyPhoto {
  status: PartyStatus;
}

export type PartyErrorCode = "network" | "key" | "closed" | "limit" | "invalid" | "unknown" | "unavailable";
export type PartyResult<T> = { ok: true; data: T } | { ok: false; code: PartyErrorCode; message: string };

export const PHOTO_BUCKET = "party-photos";
export const MAX_AUTHOR = 60;
export const MAX_CAPTION = 140;
export const MAIN_SIDE = 2000;
export const THUMB_SIDE = 480;

export interface Challenge {
  id: string;
  title: string;
  hint: string;
}

/** Défis photo: ton adulte, drôle et tendre. Un invité peut rattacher n'importe quelle photo à un défi. */
export const challenges: readonly Challenge[] = [
  { id: "selfie-laura", title: "Selfie avec Laura", hint: "Elle, vous, et le moins de recul possible." },
  { id: "groupe-fou", title: "La photo de groupe la plus folle", hint: "Plus on est de fous, plus on rit." },
  { id: "dancefloor", title: "Le meilleur du dancefloor", hint: "Le mouvement qu'on n'oubliera pas." },
  { id: "piece-a-conviction", title: "Pièce à conviction", hint: "Laura, prise sur le vif. Pour le dossier." },
  { id: "sante", title: "Santé !", hint: "Les verres levés, les grimaces." },
  { id: "detail", title: "Le détail que personne n'a vu", hint: "Un coin de la salle, une scène à part." },
];

export const challengeTitle = (id: string | null): string | null =>
  challenges.find((challenge) => challenge.id === id)?.title ?? null;

const MESSAGES: Record<PartyErrorCode, string> = {
  network: "Pas de connexion pour le moment. On réessaie automatiquement.",
  key: "Ce lien ne fonctionne pas. Scanne à nouveau le QR code de la soirée.",
  closed: "Les envois de photos sont fermés pour le moment.",
  limit: "Tu as atteint la limite de photos pour cet appareil.",
  invalid: "Cette photo n'a pas pu être acceptée.",
  unknown: "Une erreur est survenue. Réessaie dans un instant.",
  unavailable: "La galerie n'est pas disponible pour le moment.",
};

const fail = (code: PartyErrorCode): { ok: false; code: PartyErrorCode; message: string } => ({
  ok: false,
  code,
  message: MESSAGES[code],
});

// Clé du QR code et identifiant d'appareil ---------------------------------------------------

const KEY_STORAGE = "laura.party.key";
const DEVICE_STORAGE = "laura.party.device";

function readStorage(name: string): string | null {
  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeStorage(name: string, value: string): void {
  try {
    window.localStorage.setItem(name, value);
  } catch {
    // stockage indisponible (navigation privée): la fonction continue sans mémoire
  }
}

/** La clé vient de l'adresse (?k=...) puis est mémorisée pour les visites suivantes. */
export function resolvePartyKey(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("k")?.trim().toLowerCase();
  if (fromUrl) {
    writeStorage(KEY_STORAGE, fromUrl);
    return fromUrl;
  }
  return readStorage(KEY_STORAGE);
}

let memoryDevice: string | null = null;

/** Identifiant aléatoire de cet appareil: sert à retirer ses propres photos et à aimer une fois. */
export function deviceId(): string {
  const stored = readStorage(DEVICE_STORAGE);
  if (stored) return stored;
  const created = memoryDevice ?? crypto.randomUUID();
  memoryDevice = created;
  writeStorage(DEVICE_STORAGE, created);
  return created;
}

// Fonctions SQL -----------------------------------------------------------------------------

interface RpcPayload {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
}

async function rpc(name: string, args: Record<string, unknown>): Promise<PartyResult<RpcPayload>> {
  const supabase = getSupabase();
  if (!supabase) return fail("unavailable");
  const { data, error } = await supabase.rpc(name, args);
  if (error) return fail("network");
  const payload = (data ?? {}) as RpcPayload;
  if (!payload.ok) {
    const code = payload.error;
    return fail(code === "key" || code === "closed" || code === "limit" || code === "invalid" ? code : "unknown");
  }
  return { ok: true, data: payload };
}

export async function partyStatus(key: string): Promise<PartyResult<{ open: boolean; count: number }>> {
  const result = await rpc("party_status", { p_key: key });
  if (!result.ok) return result.code === "unknown" ? fail("key") : result;
  return { ok: true, data: { open: Boolean(result.data.open), count: Number(result.data.count ?? 0) } };
}

export async function partyReserve(key: string, kind: PartyKind, year: number | null): Promise<PartyResult<{ id: string }>> {
  const result = await rpc("party_reserve", { p_key: key, p_device: deviceId(), p_kind: kind, p_year: year });
  if (!result.ok) return result;
  return { ok: true, data: { id: String(result.data.id) } };
}

export interface PublishInput {
  id: string;
  author: string;
  caption: string;
  challenge: string | null;
  width: number;
  height: number;
}

export async function partyPublish(input: PublishInput): Promise<PartyResult<null>> {
  const result = await rpc("party_publish", {
    p_id: input.id,
    p_device: deviceId(),
    p_author: input.author,
    p_caption: input.caption,
    p_challenge: input.challenge,
    p_width: input.width,
    p_height: input.height,
  });
  return result.ok ? { ok: true, data: null } : result;
}

export interface PartyDelta {
  serverNow: string;
  rows: PartyDeltaRow[];
}

/** Ligne de la synchronisation: photo complète, ou simple signal de masquage/retrait. */
export type PartyDeltaRow = (PartyPhoto & { status: "approved" }) | { id: string; status: "hidden" | "removed"; updated_at: string };

export async function partyList(key: string, since: string | null): Promise<PartyResult<PartyDelta>> {
  const result = await rpc("party_list", { p_key: key, p_since: since });
  if (!result.ok) return result.code === "unknown" ? fail("key") : result;
  return { ok: true, data: { serverNow: String(result.data.server_now), rows: (result.data.rows ?? []) as PartyDeltaRow[] } };
}

export async function partyHeart(key: string, photoId: string): Promise<PartyResult<{ hearted: boolean; hearts: number }>> {
  const result = await rpc("party_heart", { p_key: key, p_photo: photoId, p_device: deviceId() });
  if (!result.ok) return result;
  return { ok: true, data: { hearted: Boolean(result.data.hearted), hearts: Number(result.data.hearts ?? 0) } };
}

export async function partyRemove(photoId: string): Promise<PartyResult<null>> {
  const result = await rpc("party_remove", { p_id: photoId, p_device: deviceId() });
  return result.ok ? { ok: true, data: null } : result;
}

/** Adapte une photo de la soirée au type Photo du site (mosaïque, visionneuse). */
export function toSitePhoto(photo: PartyPhoto): Photo {
  return {
    id: `party-${photo.id}`,
    src: photoUrl(photo.id),
    alt: photo.caption ?? `Photo de la soirée${photo.author_name ? ` par ${photo.author_name}` : ""}`,
    year: photo.year ?? new Date(photo.created_at).getFullYear(),
    universe: "mischief",
    caption: photo.caption ?? undefined,
    width: photo.width ?? 1600,
    height: photo.height ?? 1200,
  };
}

// Stockage ----------------------------------------------------------------------------------

/** Adresse publique de la photo (noms uuid: impossibles à deviner). */
export function photoUrl(id: string): string {
  const supabase = getSupabase();
  return supabase ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(`${id}.jpg`).data.publicUrl : "";
}

export function thumbUrl(id: string): string {
  const supabase = getSupabase();
  return supabase ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(`${id}_t.jpg`).data.publicUrl : "";
}

/** Envoie la photo et sa miniature. Un fichier déjà présent (reprise après coupure) compte comme un succès. */
export async function uploadPhotoFiles(id: string, main: Blob, thumb: Blob): Promise<PartyResult<null>> {
  const supabase = getSupabase();
  if (!supabase) return fail("unavailable");
  const storage = supabase.storage.from(PHOTO_BUCKET);
  for (const [name, blob] of [[`${id}.jpg`, main], [`${id}_t.jpg`, thumb]] as const) {
    const { error } = await storage.upload(name, blob, { contentType: "image/jpeg", upsert: false });
    if (!error) continue;
    const status = Number((error as { statusCode?: string | number }).statusCode);
    if (status === 409) continue; // déjà envoyé avant une coupure
    // Un refus de la base (403/400) est définitif; tout le reste (réseau, 5xx) mérite une nouvelle tentative.
    if (status === 400 || status === 403 || status === 413 || status === 415) return fail("invalid");
    return fail("network");
  }
  return { ok: true, data: null };
}

// Souvenirs: mémoire locale des photos envoyées par cet appareil (pour pouvoir les retirer) ---

const MINE_STORAGE = "laura.party.mine";
const HEARTS_STORAGE = "laura.party.hearts";
const NAME_STORAGE = "laura.party.name";

function readList(name: string): string[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(name) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export const mySentIds = (): string[] => readList(MINE_STORAGE);
export const rememberSent = (id: string): void => writeStorage(MINE_STORAGE, JSON.stringify([id, ...mySentIds().filter((x) => x !== id)].slice(0, 300)));
export const forgetSent = (id: string): void => writeStorage(MINE_STORAGE, JSON.stringify(mySentIds().filter((x) => x !== id)));
export const heartedIds = (): string[] => readList(HEARTS_STORAGE);
export const storeHearted = (ids: readonly string[]): void => writeStorage(HEARTS_STORAGE, JSON.stringify(ids.slice(0, 1500)));
export const rememberedName = (): string => readStorage(NAME_STORAGE) ?? "";
export const rememberName = (name: string): void => writeStorage(NAME_STORAGE, name);

// Organisateur (secret requis) --------------------------------------------------------------

export interface AdminSnapshot {
  key: string;
  openFrom: string | null;
  openUntil: string | null;
  rows: AdminPartyPhoto[];
}

export async function partyAdminGet(secret: string): Promise<PartyResult<AdminSnapshot>> {
  const result = await rpc("party_admin_get", { p_secret: secret });
  if (!result.ok) return result.code === "unknown" ? fail("key") : result;
  const d = result.data;
  return {
    ok: true,
    data: {
      key: String(d.key),
      openFrom: (d.open_from as string | null) ?? null,
      openUntil: (d.open_until as string | null) ?? null,
      rows: (d.rows ?? []) as AdminPartyPhoto[],
    },
  };
}

export async function partyAdminSetStatus(secret: string, id: string, status: PartyStatus): Promise<PartyResult<null>> {
  const result = await rpc("party_admin_set_status", { p_secret: secret, p_id: id, p_status: status });
  return result.ok ? { ok: true, data: null } : result;
}

export async function partyAdminSetWindow(secret: string, from: string | null, until: string | null): Promise<PartyResult<null>> {
  const result = await rpc("party_admin_set_window", { p_secret: secret, p_from: from, p_until: until });
  return result.ok ? { ok: true, data: null } : result;
}
