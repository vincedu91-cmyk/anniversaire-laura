"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import type { Photo } from "@/data/types";
import { yearLabel } from "@/data/photos";
import { duration, ease } from "@/motion/tokens";
import { PhotoFrame } from "./PhotoFrame";

interface ViewerApi {
  /** `onClose` est appelé une fois la visionneuse fermée (ex. recomposer la mosaïque). */
  open: (photo: Photo, group?: readonly Photo[], onClose?: () => void) => void;
}

const ViewerContext = createContext<ViewerApi>({ open: () => undefined });
export const usePhotoViewer = () => useContext(ViewerContext);

interface ViewerState {
  group: readonly Photo[];
  index: number;
}

/** Visionneuse plein écran: dialogue modal, focus piégé, Échap, flèches. */
export function PhotoViewerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ViewerState | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const afterClose = useRef<(() => void) | null>(null);

  const open = useCallback((photo: Photo, group: readonly Photo[] = [photo], onClose?: () => void) => {
    opener.current = document.activeElement as HTMLElement | null;
    afterClose.current = onClose ?? null;
    const index = Math.max(0, group.findIndex((item) => item.id === photo.id));
    setState({ group, index });
  }, []);

  const close = useCallback(() => {
    setState(null);
    opener.current?.focus();
    afterClose.current?.();
    afterClose.current = null;
  }, []);

  const step = useCallback((delta: number) => {
    setState((current) => {
      if (!current) return current;
      const size = current.group.length;
      return { ...current, index: (current.index + delta + size) % size };
    });
  }, []);

  const isOpen = state !== null;
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "Tab" && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>("button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, step]);

  const api = useMemo(() => ({ open }), [open]);
  const photo = state ? state.group[state.index] : null;

  return (
    <ViewerContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {state && photo && (
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Photo en plein écran"
            className="fixed inset-0 z-(--z-viewer) flex flex-col bg-finale-background/95 text-finale-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.medium, ease: ease.out }}
          >
            <div className="flex items-center justify-between p-4 md:p-8">
              <p className="mono">
                {yearLabel(photo)} / {state.index + 1} sur {state.group.length}
              </p>
              <button type="button" onClick={close} aria-label="Fermer" className="border border-current p-3">
                <X size={20} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="relative mx-4 min-h-0 flex-1 md:mx-24">
              <motion.div
                key={photo.id + state.index}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: duration.medium, ease: ease.out }}
              >
                {photo.placeholder ? (
                  <div className="mx-auto h-full max-w-3xl [container-type:inline-size]">
                    <PhotoFrame photo={photo} sizes="100vw" index={state.index} />
                  </div>
                ) : (
                  <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-contain" priority />
                )}
              </motion.div>
            </div>
            <div className="flex items-center justify-between p-4 md:p-8">
              <p className="mono max-w-[40ch]">{photo.caption ?? ""}</p>
              {state.group.length > 1 && (
                <div className="flex gap-3">
                  <button type="button" onClick={() => step(-1)} aria-label="Photo précédente" className="border border-current p-3">
                    <CaretLeft size={20} weight="bold" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Photo suivante" className="border border-current p-3">
                    <CaretRight size={20} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ViewerContext.Provider>
  );
}
