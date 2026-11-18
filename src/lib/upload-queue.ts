"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  partyPublish,
  partyReserve,
  rememberSent,
  resolvePartyKey,
  uploadPhotoFiles,
  type PartyErrorCode,
  type PartyKind,
} from "@/data/party";
import type { PreparedPhoto } from "./photo-resize";

// File d'envoi des photos: elle survit au rechargement de la page (IndexedDB) et réessaie toute seule
// quand le réseau revient (Wi-Fi de la salle capricieux, 4G). Une photo n'est jamais perdue en route.

export type UploadState = "waiting" | "sending" | "done" | "failed";

export interface UploadMeta {
  kind: PartyKind;
  year: number | null;
  author: string;
  caption: string;
  challenge: string | null;
}

export interface UploadItem extends UploadMeta {
  id: string;
  width: number;
  height: number;
  main: Blob;
  thumb: Blob;
  remoteId: string | null;
  state: UploadState;
  message: string | null;
  attempts: number;
  nextTry: number;
  /** Aperçu local (adresse d'objet): l'invité voit sa photo tout de suite. */
  preview: string;
}

type StoredItem = Omit<UploadItem, "state" | "message" | "attempts" | "nextTry" | "preview">;

const MAX_PARALLEL = 2;
const RETRY_BASE_MS = 2000;
const RETRY_MAX_MS = 45_000;

// IndexedDB ------------------------------------------------------------------------------------

const DB_NAME = "laura-party";
const STORE = "queue";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function persist(action: (store: IDBObjectStore) => IDBRequest | void): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
  db.close();
}

async function loadStored(): Promise<StoredItem[]> {
  const db = await openDb();
  if (!db) return [];
  const rows = await new Promise<StoredItem[]>((resolve) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as StoredItem[]);
    request.onerror = () => resolve([]);
  });
  db.close();
  return rows;
}

const toStored = (item: UploadItem): StoredItem => ({
  id: item.id,
  kind: item.kind,
  year: item.year,
  author: item.author,
  caption: item.caption,
  challenge: item.challenge,
  width: item.width,
  height: item.height,
  main: item.main,
  thumb: item.thumb,
  remoteId: item.remoteId,
});

// Moteur ---------------------------------------------------------------------------------------

let items: readonly UploadItem[] = [];
let active = 0;
let started = false;
let timer: number | null = null;
const listeners = new Set<() => void>();

function commit(next: readonly UploadItem[]) {
  items = next;
  listeners.forEach((listener) => listener());
}

function patch(id: string, changes: Partial<UploadItem>) {
  commit(items.map((item) => (item.id === id ? { ...item, ...changes } : item)));
}

const current = (id: string) => items.find((item) => item.id === id);

function fatalMessage(code: PartyErrorCode): string {
  if (code === "closed") return "Les envois sont fermés pour le moment.";
  if (code === "limit") return "Limite de photos atteinte sur cet appareil.";
  if (code === "key") return "Lien invalide: scanne à nouveau le QR code.";
  return "Cette photo n'a pas pu être envoyée.";
}

/** Une étape a échoué: erreur réseau = on réessaie plus tard, sinon l'échec est définitif. */
function handleFailure(id: string, code: PartyErrorCode) {
  const item = current(id);
  if (!item) return;
  if (code === "network" || code === "unavailable") {
    const attempts = item.attempts + 1;
    const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** Math.min(attempts, 5));
    patch(id, { state: "waiting", message: "En attente de connexion...", attempts, nextTry: Date.now() + delay });
    return;
  }
  patch(id, { state: "failed", message: fatalMessage(code) });
}

async function send(id: string) {
  const item = current(id);
  if (!item) return;
  const key = resolvePartyKey();
  if (!key) return handleFailure(id, "key");

  let remoteId = item.remoteId;
  if (!remoteId) {
    const reserved = await partyReserve(key, item.kind, item.year);
    if (!reserved.ok) return handleFailure(id, reserved.code);
    remoteId = reserved.data.id;
    patch(id, { remoteId });
    await persist((store) => store.put(toStored({ ...(current(id) ?? item), remoteId })));
  }

  const files = await uploadPhotoFiles(remoteId, item.main, item.thumb);
  if (!files.ok) return handleFailure(id, files.code);

  const published = await partyPublish({
    id: remoteId,
    author: item.author,
    caption: item.caption,
    challenge: item.challenge,
    width: item.width,
    height: item.height,
  });
  if (!published.ok) return handleFailure(id, published.code);

  rememberSent(remoteId);
  await persist((store) => store.delete(id));
  patch(id, { state: "done", message: null });
}

function pump() {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  const now = Date.now();
  while (active < MAX_PARALLEL) {
    const next = items.find((item) => item.state === "waiting" && item.nextTry <= now);
    if (!next) break;
    active += 1;
    patch(next.id, { state: "sending", message: null });
    void send(next.id)
      .catch(() => handleFailure(next.id, "network"))
      .finally(() => {
        active -= 1;
        pump();
      });
  }
  // Prochaine tentative programmée pour les photos en attente de connexion.
  const waiting = items.filter((item) => item.state === "waiting" && item.nextTry > now);
  if (waiting.length > 0 && active < MAX_PARALLEL) {
    const soonest = Math.min(...waiting.map((item) => item.nextTry));
    timer = window.setTimeout(pump, Math.max(250, soonest - now));
  }
}

function retryAllNow() {
  commit(items.map((item) => (item.state === "waiting" ? { ...item, nextTry: 0 } : item)));
  pump();
}

/** Charge les photos restées en file lors d'une visite précédente et branche les reprises automatiques. */
async function start() {
  if (started) return;
  started = true;
  window.addEventListener("online", retryAllNow);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) retryAllNow();
  });
  const stored = await loadStored();
  const known = new Set(items.map((item) => item.id));
  const restored: UploadItem[] = stored
    .filter((row) => !known.has(row.id))
    .map((row) => ({
      ...row,
      state: "waiting",
      message: "Reprise de l'envoi...",
      attempts: 0,
      nextTry: 0,
      preview: URL.createObjectURL(row.thumb),
    }));
  if (restored.length > 0) commit([...items, ...restored]);
  pump();
}

export interface EnqueueInput extends UploadMeta {
  prepared: PreparedPhoto;
}

export function enqueue(inputs: readonly EnqueueInput[]) {
  const added: UploadItem[] = inputs.map(({ prepared, ...meta }) => ({
    ...meta,
    id: crypto.randomUUID(),
    width: prepared.width,
    height: prepared.height,
    main: prepared.main,
    thumb: prepared.thumb,
    remoteId: null,
    state: "waiting",
    message: null,
    attempts: 0,
    nextTry: 0,
    preview: URL.createObjectURL(prepared.thumb),
  }));
  commit([...items, ...added]);
  for (const item of added) void persist((store) => store.put(toStored(item)));
  pump();
}

export function retry(id: string) {
  patch(id, { state: "waiting", message: null, attempts: 0, nextTry: 0 });
  pump();
}

export function discard(id: string) {
  const item = current(id);
  if (item) URL.revokeObjectURL(item.preview);
  commit(items.filter((entry) => entry.id !== id));
  void persist((store) => store.delete(id));
}

export function clearDone() {
  for (const item of items) if (item.state === "done") URL.revokeObjectURL(item.preview);
  commit(items.filter((item) => item.state !== "done"));
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => items;
const SERVER_SNAPSHOT: readonly UploadItem[] = [];
const getServerSnapshot = (): readonly UploadItem[] => SERVER_SNAPSHOT;

/** État de la file d'envoi, partagé entre tous les composants. */
export function useUploadQueue(): readonly UploadItem[] {
  useEffect(() => {
    void start();
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
