"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ArrowClockwise, Camera, Check, CloudArrowUp, Images, Trash, X } from "@phosphor-icons/react";
import {
  challenges,
  forgetSent,
  mySentIds,
  partyRemove,
  partyStatus,
  rememberName,
  rememberedName,
  thumbUrl,
  MAX_AUTHOR,
  MAX_CAPTION,
  type PartyKind,
} from "@/data/party";
import { preparePhoto } from "@/lib/photo-resize";
import { clearDone, discard, enqueue, retry, useUploadQueue, type UploadItem } from "@/lib/upload-queue";
import { usePartyKey } from "./usePartyGallery";

const MAX_PER_PICK = 20;
const FIELD = "w-full border-2 border-finale-ink/30 bg-finale-ink/[0.06] px-4 py-3 text-lg text-finale-ink placeholder:text-finale-ink/50 focus:border-finale-gold";
const IMAGE_NAME = /\.(jpe?g|png|webp|heic|heif|gif|avif)$/i;

type Mode = "soiree" | "souvenir";

function StateBadge({ item }: { item: UploadItem }) {
  if (item.state === "done") {
    return (
      <span className="absolute inset-0 grid place-items-center bg-finale-background/55 text-finale-gold">
        <Check size={32} weight="bold" aria-label="Envoyée" />
      </span>
    );
  }
  if (item.state === "failed") {
    return (
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/80 p-1">
        <button type="button" onClick={() => retry(item.id)} aria-label="Réessayer l'envoi" className="p-1.5 text-finale-gold">
          <ArrowClockwise size={18} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => discard(item.id)} aria-label="Abandonner cette photo" className="p-1.5 text-finale-ink">
          <X size={18} weight="bold" aria-hidden="true" />
        </button>
      </span>
    );
  }
  return (
    <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-finale-gold">
      {item.state === "sending" ? "Envoi..." : "En attente"}
    </span>
  );
}

function QueueGrid({ items }: { items: readonly UploadItem[] }) {
  if (items.length === 0) return null;
  const failed = items.find((item) => item.state === "failed");
  const waiting = items.some((item) => item.state === "waiting" && item.message);
  return (
    <div className="mt-8">
      <ul aria-label="Photos en cours d'envoi" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {items.map((item) => (
          <li key={item.id} className="relative aspect-square overflow-hidden bg-finale-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (adresse d'objet), pas une image du site */}
            <img src={item.preview} alt="" className="h-full w-full object-cover" />
            <StateBadge item={item} />
          </li>
        ))}
      </ul>
      {waiting && (
        <p role="status" className="mt-3 text-finale-ink/80">
          Connexion fragile: tes photos restent sur ton téléphone et partiront toutes seules dès que ça repasse.
        </p>
      )}
      {failed?.message && <p role="alert" className="mt-3 font-semibold text-finale-gold">{failed.message}</p>}
    </div>
  );
}

function SentPhotos({ version, onRemoved }: { version: number; onRemoved: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  // `version` relit la mémoire locale après un envoi ou un retrait.
  const ids = useMemo(() => (version >= 0 ? mySentIds() : []), [version]);
  if (ids.length === 0) return null;

  const remove = async (id: string) => {
    setBusy(id);
    const result = await partyRemove(id);
    setBusy(null);
    if (result.ok) {
      forgetSent(id);
      onRemoved();
    }
  };

  return (
    <section aria-labelledby="mine" className="mt-12 border-t border-finale-ink/20 pt-8">
      <h2 id="mine" className="mono text-finale-gold">MES PHOTOS ENVOYÉES ({ids.length})</h2>
      <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {ids.slice(0, 48).map((id) => (
          <li key={id} className="relative aspect-square overflow-hidden bg-finale-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniature du stockage, déjà réduite */}
            <img src={thumbUrl(id)} alt="Une de tes photos envoyées" loading="lazy" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={busy === id}
              onClick={() => void remove(id)}
              aria-label="Retirer cette photo de la galerie"
              className="absolute right-1 top-1 bg-black/75 p-1.5 text-finale-ink disabled:opacity-50"
            >
              <Trash size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-finale-ink/70">Un doute sur une photo ? Retire-la d&apos;un geste, elle disparaît de la galerie.</p>
    </section>
  );
}

/** Page d'envoi: pensée pour un téléphone, une main, une salle bruyante. */
export function PartyUpload() {
  const key = usePartyKey();
  const ids = { name: useId(), caption: useId(), year: useId() };
  const queue = useUploadQueue();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "souvenirs" ? "souvenir" : "soiree",
  );
  const [name, setName] = useState(() => (typeof window === "undefined" ? "" : rememberedName()));
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [preparing, setPreparing] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [closed, setClosed] = useState(false);
  const [sentVersion, setSentVersion] = useState(0);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void partyStatus(key).then((result) => {
      if (!cancelled && result.ok) setClosed(!result.data.open);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const doneCount = queue.filter((item) => item.state === "done").length;
  const pendingCount = queue.filter((item) => item.state === "waiting" || item.state === "sending").length;
  // Quand un lot est entièrement parti, on relit "mes photos envoyées".
  const [seenDone, setSeenDone] = useState(0);
  if (doneCount !== seenDone) {
    setSeenDone(doneCount);
    setSentVersion((value) => value + 1);
  }

  const kind: PartyKind = mode;
  const modeClosed = closed && mode === "soiree";

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])]
      .filter((file) => file.type.startsWith("image/") || IMAGE_NAME.test(file.name))
      .slice(0, MAX_PER_PICK);
    event.target.value = "";
    if (files.length === 0) return;
    rememberName(name.trim());
    setProblems([]);
    setPreparing({ done: 0, total: files.length });
    const failed: string[] = [];
    const parsedYear = Number(year);
    for (const [index, file] of files.entries()) {
      try {
        const prepared = await preparePhoto(file);
        enqueue([
          {
            prepared,
            kind,
            year: kind === "souvenir" && Number.isInteger(parsedYear) && parsedYear >= 1990 && parsedYear <= 2030 ? parsedYear : null,
            author: name.trim().slice(0, MAX_AUTHOR),
            caption: caption.trim().slice(0, MAX_CAPTION),
            challenge: kind === "soiree" ? challenge : null,
          },
        ]);
      } catch {
        failed.push(file.name || "photo");
      }
      setPreparing({ done: index + 1, total: files.length });
    }
    setPreparing(null);
    setCaption("");
    setChallenge(null);
    if (failed.length > 0) setProblems(failed);
  };

  if (key === undefined) return <p className="mono text-finale-ink/60">CHARGEMENT...</p>;

  if (key === null) {
    return (
      <div role="status" className="border-2 border-finale-gold/60 p-6">
        <p className="display text-4xl text-finale-gold">SCANNE LE QR CODE</p>
        <p className="mt-4 max-w-[34ch] text-lg">Cette page s&apos;ouvre avec le QR code affiché pendant la soirée. Scanne-le avec l&apos;appareil photo de ton téléphone.</p>
      </div>
    );
  }

  const busy = preparing !== null;

  return (
    <div>
      <div role="group" aria-label="Type de photo" className="flex gap-2">
        {([["soiree", "La soirée"], ["souvenir", "Souvenirs avec Laura"]] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`border-2 px-4 py-2 font-semibold transition-colors duration-(--motion-fast) ${mode === value ? "border-finale-gold bg-finale-gold text-finale-background" : "border-finale-ink/30"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "souvenir" && (
        <p className="mt-4 max-w-[46ch] text-finale-ink/80">
          Une vieille photo avec Laura, de n&apos;importe quelle année ? Envoie-la: elle rejoindra l&apos;album des souvenirs.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.name} className="font-semibold">Ton prénom <span className="font-normal text-finale-ink/60">(facultatif)</span></label>
          <input
            id={ids.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => rememberName(name.trim())}
            maxLength={MAX_AUTHOR}
            autoComplete="given-name"
            className={FIELD}
          />
        </div>

        {mode === "soiree" ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="font-semibold">Un défi ? <span className="font-normal text-finale-ink/60">(facultatif)</span></legend>
            <div className="flex flex-wrap gap-2">
              {challenges.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={challenge === item.id}
                  onClick={() => setChallenge(challenge === item.id ? null : item.id)}
                  className={`border-2 px-3 py-2 text-left text-sm font-semibold leading-tight transition-colors duration-(--motion-fast) ${challenge === item.id ? "border-finale-gold bg-finale-gold text-finale-background" : "border-finale-ink/30"}`}
                >
                  {item.title}
                </button>
              ))}
            </div>
            {challenge && <p className="text-sm text-finale-ink/70">{challenges.find((item) => item.id === challenge)?.hint}</p>}
          </fieldset>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.year} className="font-semibold">Année <span className="font-normal text-finale-ink/60">(facultatif)</span></label>
            <input id={ids.year} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="2012" className={`${FIELD} max-w-40`} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor={ids.caption} className="font-semibold">
            {mode === "soiree" ? "Un mot sur la photo" : "Où ? Quand ? Une anecdote ?"} <span className="font-normal text-finale-ink/60">(facultatif)</span>
          </label>
          <textarea id={ids.caption} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={MAX_CAPTION} rows={2} className={`${FIELD} resize-none`} />
          <p className="mono text-finale-ink/60">{caption.length} / {MAX_CAPTION}</p>
        </div>

        {modeClosed ? (
          <p role="status" className="border-2 border-finale-gold/60 p-4 text-lg">
            Les envois de la soirée sont fermés pour le moment. Tu peux toujours <Link href="/galerie" className="underline">voir la galerie</Link>.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => cameraInput.current?.click()}
              className="flex items-center justify-center gap-3 bg-finale-gold px-6 py-5 text-xl font-bold text-finale-background transition-transform duration-(--motion-fast) active:scale-[0.98] disabled:opacity-60"
            >
              <Camera size={28} weight="fill" aria-hidden="true" /> Prendre une photo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => galleryInput.current?.click()}
              className="flex items-center justify-center gap-3 border-2 border-finale-gold px-6 py-5 text-xl font-bold text-finale-gold transition-transform duration-(--motion-fast) active:scale-[0.98] disabled:opacity-60"
            >
              <Images size={28} weight="fill" aria-hidden="true" /> Choisir des photos
            </button>
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={(e) => void onPick(e)} className="sr-only" tabIndex={-1} aria-hidden="true" />
            <input ref={galleryInput} type="file" accept="image/*" multiple onChange={(e) => void onPick(e)} className="sr-only" tabIndex={-1} aria-hidden="true" />
          </div>
        )}

        {preparing && (
          <p role="status" className="flex items-center gap-3 text-lg">
            <CloudArrowUp size={24} aria-hidden="true" /> Préparation {preparing.done} / {preparing.total}...
          </p>
        )}
        {problems.length > 0 && (
          <p role="alert" className="border-2 border-finale-gold p-3 font-semibold">
            Format non pris en charge pour: {problems.join(", ")}. Essaie une photo en JPEG.
          </p>
        )}
      </div>

      <QueueGrid items={queue} />

      {doneCount > 0 && pendingCount === 0 && (
        <div role="status" className="mt-8 border-2 border-finale-gold bg-finale-gold/10 p-6">
          <p className="display text-4xl text-finale-gold">MERCI{name.trim() ? ` ${name.trim()}` : ""} !</p>
          <p className="mt-3 text-lg">{doneCount === 1 ? "Ta photo est" : `Tes ${doneCount} photos sont`} dans la galerie.</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/galerie" className="bg-finale-ink px-5 py-3 font-semibold text-finale-background">Voir la galerie</Link>
            <Link href="/livre-d-or" className="border-2 border-finale-ink px-5 py-3 font-semibold">Laisser aussi un mot</Link>
            <button type="button" onClick={clearDone} className="px-2 py-3 font-semibold underline">Envoyer d&apos;autres photos</button>
          </div>
        </div>
      )}

      <SentPhotos version={sentVersion} onRemoved={() => setSentVersion((value) => value + 1)} />

      <p className="mt-12 max-w-[52ch] text-sm leading-relaxed text-finale-ink/65">
        En envoyant une photo, tu acceptes qu&apos;elle soit visible par les invités et projetée pendant la soirée. Elle est réduite sur ton téléphone avant l&apos;envoi.
        Tu peux la retirer à tout moment depuis cette page, sur le même téléphone.
      </p>
    </div>
  );
}
