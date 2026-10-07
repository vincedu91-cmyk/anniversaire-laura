"use client";

import { useSyncExternalStore } from "react";

// Signal "le chargement est terminé": les entrées de la page d'accueil attendent la fin du loader.
let ready = false;
const listeners = new Set<() => void>();

export function markReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useReady(): boolean {
  return useSyncExternalStore(subscribe, () => ready, () => false);
}
