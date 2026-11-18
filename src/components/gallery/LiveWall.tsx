"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart } from "@phosphor-icons/react";
import { challengeTitle, challenges, photoUrl, thumbUrl, type PartyPhoto } from "@/data/party";
import { usePartyGallery } from "./usePartyGallery";

// Écran géant de la soirée. Deux modes:
//  - "live": les nouvelles photos tombent à l'écran dès qu'elles arrivent, puis défilent les plus aimées;
//  - "best": diaporama automatique des meilleures photos de la soirée (après la fête, ou en boucle).
// Aucune souris: F plein écran, Espace pause, flèche droite = photo suivante.

type Mode = "live" | "best";
type Reason = "new" | "best" | "recent";
interface Featured {
  photo: PartyPhoto;
  reason: Reason;
}

const NEW_MS = 9000;
const NEW_FAST_MS = 5000;
const HIGHLIGHT_MS = 8000;
const SLIDE_MS = 7000;
const INTERRUPT_MS = 1200;
const BACKDROP_TILES = 18;

/** Inclinaison stable par photo (-4 à +4 degrés). */
const tilt = (id: string) => (parseInt(id.slice(0, 4), 16) % 9) - 4;

const byHearts = (a: PartyPhoto, b: PartyPhoto) => b.hearts - a.hearts || (a.created_at < b.created_at ? 1 : -1);

/** Ordre de défilement: les plus aimées en tête, mêlées aux plus récentes (live) ou suivies des autres (diaporama). */
function buildPool(photos: readonly PartyPhoto[], mode: Mode): Featured[] {
  const pool = mode === "live" ? photos.filter((photo) => photo.kind === "soiree") : [...photos];
  const best = pool.filter((photo) => photo.hearts > 0).sort(byHearts).slice(0, mode === "live" ? 10 : pool.length);
  const bestIds = new Set(best.map((photo) => photo.id));
  const rest = pool.filter((photo) => !bestIds.has(photo.id)).slice(0, mode === "live" ? 12 : pool.length);
  if (mode === "best") {
    return [...best.map((photo) => ({ photo, reason: "best" as const })), ...rest.map((photo) => ({ photo, reason: "recent" as const }))];
  }
  const out: Featured[] = [];
  for (let i = 0; i < Math.max(best.length, rest.length); i += 1) {
    if (best[i]) out.push({ photo: best[i], reason: "best" });
    if (rest[i]) out.push({ photo: rest[i], reason: "recent" });
  }
  return out;
}

function Qr({ value, className }: { value: string | null; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    void import("qrcode").then(async (QRCode) => {
      const url = await QRCode.toDataURL(value, { margin: 1, width: 360, color: { dark: "#070605", light: "#ffd27a" } });
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);
  // eslint-disable-next-line @next/next/no-img-element -- image générée dans le navigateur (adresse de données)
  return src ? <img src={src} alt="QR code pour ajouter une photo" className={className} /> : null;
}

/** Une tuile du fond: change de photo toute seule, à son propre rythme, en fondu. */
function BackdropTile({ photos, slot }: { photos: readonly PartyPhoto[]; slot: number }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((value) => value + 1), 11_000 + slot * 900);
    return () => window.clearInterval(timer);
  }, [slot]);
  const photo = photos[(slot * 5 + step * 7) % photos.length];
  return (
    <div className="relative overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.img
          key={photo.id}
          src={thumbUrl(photo.id)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6 }}
        />
      </AnimatePresence>
    </div>
  );
}

function Backdrop({ photos }: { photos: readonly PartyPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-40 saturate-[0.8]">
      {Array.from({ length: BACKDROP_TILES }, (_, slot) => (
        <BackdropTile key={slot} photos={photos} slot={slot} />
      ))}
    </div>
  );
}

const BADGES: Record<Reason, string> = { new: "NOUVELLE PHOTO", best: "TRÈS AIMÉE", recent: "DE LA SOIRÉE" };

function Polaroid({ featured, mode }: { featured: Featured; mode: Mode }) {
  const { photo, reason } = featured;
  const rest = tilt(photo.id);
  const fromAbove = reason === "new";
  const title = challengeTitle(photo.challenge);
  const meta = [photo.author_name, title].filter(Boolean).join(" / ");

  return (
    <motion.figure
      key={photo.id}
      data-m
      className="absolute left-1/2 top-1/2 m-0 flex max-w-[78vw] flex-col bg-finale-ink p-[1.1vmin] pb-[2.4vmin] text-finale-background shadow-[0_3vmin_8vmin_rgb(0_0_0/0.7)]"
      style={{ x: "-50%", y: "-50%" }}
      initial={fromAbove ? { y: "-190%", rotate: rest - 16, scale: 1.12 } : { opacity: 0, scale: 0.9, rotate: rest - 3 }}
      animate={{ y: "-50%", rotate: rest, scale: 1, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.92, rotate: rest + 5, y: "-42%", transition: { duration: 0.7 } }}
      transition={fromAbove ? { type: "spring", stiffness: 90, damping: 13, mass: 1.1 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <span aria-hidden="true" className="absolute -top-[1.6vmin] left-1/2 block h-[3vmin] w-[11vmin] -translate-x-1/2 -rotate-2 bg-finale-gold/90" />
      {/* eslint-disable-next-line @next/next/no-img-element -- photo du stockage Supabase, déjà réduite côté téléphone */}
      <img src={photoUrl(photo.id)} alt={photo.caption ?? ""} className="block max-h-[66vh] max-w-[70vw] object-contain" />
      <figcaption className="flex items-end justify-between gap-[3vmin] pt-[1.6vmin]">
        <div className="min-w-0">
          {photo.caption && <p className="font-hand text-[3.4vmin] leading-tight">{photo.caption}</p>}
          {meta && <p className="mono mt-[0.6vmin] text-[1.5vmin] opacity-70">{meta}</p>}
        </div>
        {photo.hearts > 0 && (
          <p className="flex shrink-0 items-center gap-[0.8vmin] text-[2.6vmin] font-bold">
            <Heart size="1em" weight="fill" aria-hidden="true" /> {photo.hearts}
          </p>
        )}
      </figcaption>
      {mode === "live" && (
        <span className="mono absolute -right-[1.2vmin] -top-[2.4vmin] rotate-3 bg-finale-gold px-[1.6vmin] py-[0.8vmin] text-[1.7vmin] font-bold text-finale-background">
          {BADGES[reason]}
        </span>
      )}
    </motion.figure>
  );
}

/** Diaporama: la photo remplit l'écran, flou de la même photo en fond, zoom lent. */
function Slide({ featured }: { featured: Featured }) {
  const { photo } = featured;
  const title = challengeTitle(photo.challenge);
  return (
    <motion.div key={photo.id} data-m className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- fond flou: la miniature suffit */}
      <img src={thumbUrl(photo.id)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
      <motion.div className="absolute inset-0" initial={{ scale: 1 }} animate={{ scale: 1.06 }} transition={{ duration: SLIDE_MS / 1000 + 1.4, ease: "linear" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- photo du stockage Supabase */}
        <img src={photoUrl(photo.id)} alt={photo.caption ?? ""} className="absolute inset-0 h-full w-full object-contain" />
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[4vmin] bg-gradient-to-t from-black/80 to-transparent px-[5vmin] pb-[4vmin] pt-[14vmin]">
        <div>
          {photo.caption && <p className="font-hand text-[5vmin] leading-tight">{photo.caption}</p>}
          <p className="mono mt-[0.8vmin] text-[1.8vmin] text-finale-ink/80">{[photo.author_name, title].filter(Boolean).join(" / ")}</p>
        </div>
        {photo.hearts > 0 && (
          <p className="flex items-center gap-[1vmin] text-[4vmin] font-bold text-finale-gold">
            <Heart size="1em" weight="fill" aria-hidden="true" /> {photo.hearts}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function LiveWall({ mode }: { mode: Mode }) {
  // File d'attente des nouvelles photos: dans une référence (lue par le minuteur), sa taille dans l'état.
  const queueRef = useRef<PartyPhoto[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [shown, setShown] = useState<Featured | null>(null);
  const [paused, setPaused] = useState(false);
  const [hint, setHint] = useState(true);
  const cursor = useRef(0);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const onArrivals = useCallback(
    (fresh: readonly PartyPhoto[]) => {
      if (mode !== "live") return;
      const soiree = fresh.filter((photo) => photo.kind === "soiree");
      if (soiree.length === 0) return;
      queueRef.current = [...queueRef.current, ...soiree];
      setQueueSize(queueRef.current.length);
    },
    [mode],
  );
  const { key, status, photos } = usePartyGallery(mode === "live" ? 4000 : 15_000, onArrivals);

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  });

  // Mode écran géant: animations jamais neutralisées, pas de défilement, écran maintenu allumé.
  useEffect(() => {
    document.documentElement.dataset.projection = "";
    document.documentElement.style.overflow = "hidden";
    void navigator.wakeLock?.request("screen").then((lock) => {
      wakeLock.current = lock;
    }).catch(() => undefined);
    const hideHint = window.setTimeout(() => setHint(false), 9000);
    return () => {
      delete document.documentElement.dataset.projection;
      document.documentElement.style.overflow = "";
      void wakeLock.current?.release();
      window.clearTimeout(hideHint);
    };
  }, []);

  const advance = useCallback(() => {
    // Les nouvelles photos passent toujours avant le reste.
    let next: Featured | null = null;
    const head = queueRef.current[0];
    if (head) {
      next = { photo: head, reason: "new" };
      queueRef.current = queueRef.current.slice(1);
      setQueueSize(queueRef.current.length);
    } else {
      const pool = buildPool(photosRef.current, mode);
      if (pool.length > 0) {
        next = pool[cursor.current % pool.length];
        cursor.current += 1;
      }
    }
    setShown(next);
  }, [mode]);

  const hasQueue = queueSize > 0;
  useEffect(() => {
    if (paused) return;
    let delay: number;
    if (!shown) delay = 800;
    else if (mode === "best") delay = SLIDE_MS;
    else if (shown.reason === "new") delay = queueSize > 2 ? NEW_FAST_MS : NEW_MS;
    else delay = hasQueue ? INTERRUPT_MS : HIGHLIGHT_MS;
    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [shown, hasQueue, queueSize, paused, advance, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const k = event.key.toLowerCase();
      if (k === "f") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.().catch(() => undefined);
      } else if (k === " " || k === "p") setPaused((value) => !value);
      else if (k === "arrowright") advance();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  const soiree = useMemo(() => photos.filter((photo) => photo.kind === "soiree"), [photos]);
  const challengeCounts = useMemo(
    () =>
      challenges
        .map((item) => ({ title: item.title, count: soiree.filter((photo) => photo.challenge === item.id).length }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    [soiree],
  );
  const qrValue = useMemo(() => (key && typeof window !== "undefined" ? `${window.location.origin}/photos?k=${key}` : null), [key]);

  if (key === null || status === "denied") {
    return (
      <div className="fixed inset-0 grid place-items-center bg-finale-background px-6 text-center text-finale-ink">
        <div>
          <p className="display text-[clamp(3rem,9vw,8rem)] text-finale-gold">LIEN INCOMPLET</p>
          <p className="mono mt-6">OUVRE CETTE PAGE AVEC LE LIEN DONNÉ PAR L&apos;ORGANISATEUR (?k=...)</p>
        </div>
      </div>
    );
  }

  const empty = status === "ready" && !shown && (mode === "best" ? photos.length === 0 : soiree.length === 0);

  return (
    <div className="fixed inset-0 cursor-none overflow-hidden bg-finale-background text-finale-ink" data-scene="finale">
      {mode === "live" && <Backdrop photos={soiree} />}
      {mode === "live" && <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(7_6_5/0.2),rgb(7_6_5/0.85)_85%)]" />}

      <AnimatePresence mode="sync">
        {shown && (mode === "best" ? <Slide key={shown.photo.id} featured={shown} /> : <Polaroid key={shown.photo.id} featured={shown} mode={mode} />)}
      </AnimatePresence>

      {empty && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="display text-[clamp(3rem,10vw,10rem)] text-finale-gold">{mode === "live" ? "SOIS LA PREMIÈRE" : "PAS ENCORE DE PHOTOS"}</p>
            <p className="mono mt-[3vmin] text-[2vmin]">{mode === "live" ? "SCANNE LE QR CODE, ENVOIE UNE PHOTO, ELLE APPARAÎT ICI." : "ELLES APPARAÎTRONT ICI AUTOMATIQUEMENT."}</p>
          </div>
        </div>
      )}

      {mode === "live" && (
        <>
          <p className="mono absolute right-[3vmin] top-[3vmin] text-[1.7vmin] text-finale-gold">LA SOIRÉE DE LAURA</p>
          <div className="absolute bottom-[3vmin] left-[3vmin] flex items-end gap-[2vmin]">
            <Qr value={qrValue} className="h-[16vmin] w-[16vmin]" />
            <div>
              <p className="display text-[4.4vmin] text-finale-gold">POSTE TA PHOTO</p>
              <p className="mono mt-[0.8vmin] text-[1.6vmin]">{soiree.length} PHOTO{soiree.length > 1 ? "S" : ""} DÉJÀ</p>
            </div>
          </div>
          {challengeCounts.length > 0 && (
            <p className="mono absolute bottom-[3vmin] right-[3vmin] max-w-[40vw] text-right text-[1.5vmin] leading-relaxed text-finale-ink/80">
              {challengeCounts.map((item) => `${item.title} (${item.count})`).join("  /  ")}
            </p>
          )}
        </>
      )}

      {hint && <p role="status" className="mono absolute inset-x-0 top-[3vmin] text-center text-[1.5vmin] text-finale-ink/60">F: PLEIN ÉCRAN / ESPACE: PAUSE / FLÈCHE DROITE: SUIVANTE</p>}
      {paused && (
        <p role="status" className="display absolute inset-0 grid place-items-center bg-black/55 text-[12vmin]">PAUSE</p>
      )}
    </div>
  );
}
