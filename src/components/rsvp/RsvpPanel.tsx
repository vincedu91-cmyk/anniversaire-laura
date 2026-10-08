"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Question, X } from "@phosphor-icons/react";
import { eventInfo, rsvpGet, rsvpRespond, type Answer, type GuestSummary } from "@/data/rsvp";

type View =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "unavailable"; message: string }
  | { kind: "ready"; guest: GuestSummary };

const CHOICES: readonly { answer: Answer; label: string; confirm: string; tone: string; icon: typeof Check }[] = [
  { answer: "yes", label: "Je serai là", confirm: "Super, on t'attend !", tone: "bg-mischief-green text-mischief-ink", icon: Check },
  { answer: "maybe", label: "Peut-être", confirm: "C'est noté, tu nous confirmes dès que tu sais.", tone: "bg-mischief-blue text-mischief-paper", icon: Question },
  { answer: "no", label: "Je ne pourrai pas", confirm: "Dommage, tu nous manqueras.", tone: "bg-mischief-secondary text-mischief-paper", icon: X },
];

// Aperçu du design sans base de données: /invitation?c=demo (développement uniquement).
const DEMO = process.env.NODE_ENV !== "production";

const HARD_SHADOW = "shadow-[8px_8px_0_0_rgb(17_17_17)]";

/** Page de réponse d'un invité: un clic sur Présent, Peut-être ou Absent. Modifiable à tout moment. */
export function RsvpPanel() {
  const token = useSearchParams().get("c") ?? "";
  const [view, setView] = useState<View>({ kind: "loading" });
  const [saving, setSaving] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (DEMO && token === "demo") {
      void Promise.resolve().then(() => !cancelled && setView({ kind: "ready", guest: { first_name: "Camille", status: "pending", responded_at: null } }));
      return () => {
        cancelled = true;
      };
    }
    void rsvpGet(token).then((result) => {
      if (cancelled) return;
      if (!result.ok) setView({ kind: "unavailable", message: result.error });
      else setView(result.data ? { kind: "ready", guest: result.data } : { kind: "invalid" });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const answer = useCallback(
    async (choice: Answer) => {
      setSaving(choice);
      setError(null);
      const result = DEMO && token === "demo" ? ({ ok: true, data: null } as const) : await rsvpRespond(token, choice);
      setSaving(null);
      if (!result.ok) {
        setError("Ta réponse n'a pas pu être enregistrée. Réessaie dans un instant.");
        return;
      }
      setView((current) =>
        current.kind === "ready" ? { kind: "ready", guest: { ...current.guest, status: choice, responded_at: new Date().toISOString() } } : current,
      );
    },
    [token],
  );

  if (view.kind === "loading") {
    return <p role="status" className="mono">CHARGEMENT...</p>;
  }
  if (view.kind === "invalid") {
    return (
      <div role="alert" className="max-w-[40ch]">
        <p className="display text-[clamp(2.5rem,8vw,6rem)]">LIEN INCONNU</p>
        <p className="mt-4 text-lg">Ce lien d&apos;invitation n&apos;est pas valide. Utilise le bouton de ton e-mail, ou contacte l&apos;organisateur : {eventInfo.organizerContact}</p>
      </div>
    );
  }
  if (view.kind === "unavailable") {
    return <p role="alert" className="max-w-[40ch] text-lg">{view.message}</p>;
  }

  const { guest } = view;
  const chosen = CHOICES.find((choice) => choice.answer === guest.status);

  return (
    <div>
      <p className="mono">INVITATION</p>
      <h1 className="display mt-3 text-[clamp(3.5rem,13vw,13rem)]">SALUT {guest.first_name}</h1>
      <p className="mt-5 max-w-[26ch] text-[clamp(1.4rem,3vw,2.4rem)] font-bold leading-tight">
        Tu viens fêter les 18 ans de Laura ?
      </p>

      <div role="group" aria-label="Ta réponse" className="mt-10 grid max-w-[44rem] gap-5">
        {CHOICES.map(({ answer: value, label, tone, icon: Icon }) => {
          const selected = guest.status === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              disabled={saving !== null}
              onClick={() => void answer(value)}
              className={`flex items-center gap-5 border-[6px] border-mischief-ink px-6 py-5 text-left text-[clamp(1.5rem,3.4vw,2.4rem)] font-extrabold leading-none transition-transform duration-(--motion-fast) ease-(--ease-spring) hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 motion-reduce:transition-none ${tone} ${selected ? `${HARD_SHADOW} -translate-y-1` : "shadow-[4px_4px_0_0_rgb(17_17_17)]"}`}
            >
              <Icon size={34} weight="bold" aria-hidden="true" />
              <span className="flex-1">{saving === value ? "Enregistrement..." : label}</span>
              {selected && <span className="mono border-2 border-current px-2 py-1 text-xs">TA RÉPONSE</span>}
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-6 max-w-[44rem] border-[3px] border-mischief-secondary bg-mischief-paper p-3 font-semibold text-mischief-secondary">{error}</p>}

      <div role="status" className="mt-8 min-h-[3.5rem] max-w-[44rem]">
        {chosen && (
          <>
            <p className="text-xl font-bold">{chosen.confirm}</p>
            <p className="mt-1">Tu peux changer d&apos;avis à tout moment : reviens simplement sur cette page.</p>
          </>
        )}
      </div>

      <dl className="mt-10 grid max-w-[44rem] gap-4 border-t-[6px] border-mischief-ink pt-6 sm:grid-cols-3">
        {([["Quand", `${eventInfo.date} ${eventInfo.time}`], ["Où", eventInfo.place], ["Réponse avant le", eventInfo.replyBefore]] as const).map(([term, value]) => (
          <div key={term}>
            <dt className="mono">{term}</dt>
            <dd className="mt-1 text-lg font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
