"use client";

import { useId, useState, type FormEvent } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { MAX_NAME, MAX_TEXT, submitTextMessage, submitVoiceMessage } from "@/data/guestbook";
import { VoiceRecorder, type Recording } from "./VoiceRecorder";

type Mode = "text" | "voice";
type Status = "idle" | "sending" | "sent";

const FIELD = "w-full border-2 border-childhood-ink bg-white/70 px-4 py-3 text-lg text-childhood-ink placeholder:text-childhood-ink/60";

/** Formulaire d'un proche: un mot écrit ou un message vocal, relu avant d'être montré à Laura. */
export function GuestbookForm() {
  const ids = { name: useId(), text: useId(), hint: useId() };
  const [mode, setMode] = useState<Mode>("text");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (honeypot) {
      setStatus("sent"); // robot: on fait semblant, rien n'est envoyé
      return;
    }
    if (mode === "voice" && !recording) {
      setError("Enregistre d'abord ton message vocal.");
      return;
    }
    setStatus("sending");
    const result =
      mode === "text"
        ? await submitTextMessage({ name, body: text })
        : await submitVoiceMessage({ name, blob: recording!.blob, seconds: recording!.seconds });
    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      return;
    }
    setStatus("sent");
  };

  const again = () => {
    setText("");
    setRecording(null);
    setStatus("idle");
  };

  if (status === "sent") {
    return (
      <div role="status" className="border-2 border-childhood-ink bg-childhood-butter p-6">
        <p className="font-hand text-4xl leading-tight">Merci {name.trim() || ""} !</p>
        <p className="mt-3 text-lg">Ton message a bien été reçu. Il sera relu avant d&apos;être montré à Laura.</p>
        <button type="button" onClick={again} className="mt-6 border-b-2 border-current py-1 font-semibold">
          Laisser un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor={ids.name} className="font-semibold">Ton prénom</label>
        <input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_NAME} autoComplete="given-name" required className={FIELD} />
      </div>

      <div role="group" aria-label="Type de message" className="flex gap-3">
        {([["text", "Écrire"], ["voice", "Parler"]] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`border-2 border-childhood-ink px-5 py-2 font-semibold transition-colors duration-(--motion-fast) ${mode === value ? "bg-childhood-ink text-childhood-background" : "bg-transparent text-childhood-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.text} className="font-semibold">Ton message pour Laura</label>
          <textarea id={ids.text} value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_TEXT} rows={7} aria-describedby={ids.hint} className={`${FIELD} resize-y`} />
          <p id={ids.hint} className="mono text-childhood-ink/80">{text.length} / {MAX_TEXT}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Ton message vocal (1 minute maximum)</p>
          <VoiceRecorder onChange={setRecording} />
        </div>
      )}

      {/* Piège à robots: invisible pour les humains. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ne pas remplir
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      {error && (
        <p role="alert" className="border-2 border-mischief-secondary bg-mischief-paper p-3 font-semibold text-mischief-secondary">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex items-center gap-3 bg-childhood-ink px-7 py-4 text-lg font-semibold text-childhood-background transition-transform duration-(--motion-fast) active:scale-[0.97] disabled:opacity-60"
        >
          <PaperPlaneTilt size={22} weight="fill" aria-hidden="true" />
          {status === "sending" ? "Envoi..." : "Envoyer"}
        </button>
        <p className="max-w-[34ch] text-childhood-ink/90">Ton message sera relu avant d&apos;être montré à Laura.</p>
      </div>
    </form>
  );
}
