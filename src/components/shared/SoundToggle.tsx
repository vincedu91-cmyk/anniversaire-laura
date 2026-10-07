"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useScene } from "./SceneContext";
import { MagneticWrap } from "../motion/MagneticWrap";

/** SOUND ON / SOUND OFF. Le son ne démarre jamais sans ce clic. */
export function SoundToggle() {
  const { soundOn, toggleSound } = useScene();
  return (
    <MagneticWrap strength={0.35}>
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={soundOn}
        className="mono group flex items-center gap-2 border border-current px-3 py-2 transition-transform duration-(--motion-fast) active:scale-[0.97]"
      >
        {soundOn ? <SpeakerHigh size={16} weight="bold" aria-hidden="true" /> : <SpeakerSlash size={16} weight="bold" aria-hidden="true" />}
        <span>{soundOn ? "SOUND ON" : "SOUND OFF"}</span>
      </button>
    </MagneticWrap>
  );
}
