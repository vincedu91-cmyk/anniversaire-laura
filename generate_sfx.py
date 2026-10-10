#!/usr/bin/env python3
"""Synthétise les bruitages (SFX_*) de timeline.json en WAV, sans dépendance externe autre que numpy.

Usage :  python generate_sfx.py   → assets/audio/sfx/<ID>.wav (44,1 kHz, mono, 16 bits)

Ce sont des approximations « maison » pour rythmer le montage et valider l'animatique.
Pour la version finale, chaque fichier peut être remplacé par un son de bibliothèque
(Freesound, Pixabay, Mixkit…) portant le même nom : la timeline n'a pas à changer.
"""
from __future__ import annotations

import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent / "assets" / "audio" / "sfx"
PEAK_DBFS = -1.0
rng = np.random.default_rng(1818)  # graine fixe : rendu identique à chaque exécution


# ---------------------------------------------------------------- primitives
def timeline(duration: float) -> np.ndarray:
    return np.arange(int(duration * SR)) / SR


def noise(duration: float) -> np.ndarray:
    return rng.uniform(-1, 1, int(duration * SR))


def phase(freq: np.ndarray | float, duration: float) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=float), (int(duration * SR),))
    return np.cumsum(2 * np.pi * f / SR)


def sine(freq, duration):
    return np.sin(phase(freq, duration))


def saw(freq, duration):
    p = phase(freq, duration) / (2 * np.pi)
    return 2 * (p - np.floor(p + 0.5))


def square(freq, duration):
    return np.sign(sine(freq, duration))


def lowpass(x: np.ndarray, cutoff) -> np.ndarray:
    """Filtre passe-bas à un pôle ; cutoff (Hz) peut varier dans le temps."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * np.clip(c, 10, SR / 2.2) / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def bandpass(x, low, high):
    return lowpass(x, high) - lowpass(x, low)


def decay(duration: float, tau: float) -> np.ndarray:
    return np.exp(-timeline(duration) / tau)


def glide(start: float, end: float, duration: float) -> np.ndarray:
    """Glissement exponentiel de fréquence."""
    return start * (end / start) ** (timeline(duration) / duration)


def bell_env(duration: float) -> np.ndarray:
    return np.sin(np.pi * timeline(duration) / duration) ** 2


def place(total: float, parts: list[tuple[float, np.ndarray]]) -> np.ndarray:
    """Mixe des fragments à des instants donnés dans un tampon de `total` secondes."""
    out = np.zeros(int(total * SR))
    for at, sig in parts:
        i = int(at * SR)
        n = min(len(sig), len(out) - i)
        out[i:i + n] += sig[:n]
    return out


def fade_tail(x: np.ndarray, seconds: float = 0.02) -> np.ndarray:
    n = min(len(x), int(seconds * SR))
    y = x.copy()
    y[-n:] *= np.linspace(1, 0, n)
    return y


# ---------------------------------------------------------------- briques sonores
def whoosh(duration, low, high, gain=1.0):
    t = timeline(duration)
    cutoff = low + (high - low) * np.sin(np.pi * t / duration) ** 2
    return gain * lowpass(noise(duration), cutoff) * bell_env(duration)


def ping(freq, duration=0.25, tau=0.08):
    return sine(freq, duration) * decay(duration, tau)


def bell(freq, duration=1.6):
    partials = sine(freq, duration) + 0.4 * sine(freq * 2.76, duration) + 0.2 * sine(freq * 5.4, duration)
    return partials * decay(duration, 0.5)


def pop(f0, f1, duration=0.3):
    body = sine(glide(f0, f1, duration), duration) * decay(duration, 0.04)
    click = np.zeros_like(body)
    click[:60] = np.linspace(1, 0, 60)
    return body + 0.3 * click


def snare(duration=0.4):
    return 0.7 * bandpass(noise(duration), 1200, 7000) * decay(duration, 0.07) + 0.5 * ping(190, duration, 0.05)


def crash(duration=1.6):
    return highpass(noise(duration), 4000) * decay(duration, 0.45)


def brass(freqs, duration, cutoff=1800):
    tone = sum(saw(f * (1 + 0.003 * k), duration) for k, f in enumerate(freqs)) / len(freqs)
    attack = np.minimum(1, timeline(duration) / 0.02)
    return lowpass(tone, cutoff) * attack


def clap(duration=0.06):
    return bandpass(noise(duration), 900, 2600) * decay(duration, 0.012)


# ---------------------------------------------------------------- catalogue (id → fonction)
def sfx_int_riser():
    d = 5.0
    t = timeline(d)
    body = lowpass(noise(d), glide(300, 9000, d)) + 0.35 * saw(glide(110, 880, d), d)
    return fade_tail(body * (t / d) ** 2.2)


def sfx_int_impact():
    d = 2.0
    boom = sine(glide(95, 32, d), d) * decay(d, 0.55)
    hit = lowpass(noise(d), 2500) * decay(d, 0.12)
    return np.tanh(1.6 * (boom + 0.6 * hit))


def sfx_int_whoosh():
    return whoosh(1.0, 500, 6000)


def sfx_enf_bulle_pop():
    return pop(700, 1900, 0.3)


def sfx_enf_carillon():
    return place(2.0, [(0.0, bell(1046.5)), (0.16, bell(1318.5)), (0.32, bell(1568.0))])


def sfx_enf_whoosh_doux():
    return whoosh(1.5, 250, 2200, 0.8)


def sfx_enf_page():
    def rustle(d):
        gate = (rng.uniform(0, 1, int(d * SR)) > 0.55).astype(float)
        return highpass(noise(d), 2500) * lowpass(gate, 60) * bell_env(d)
    return place(1.0, [(0.0, rustle(0.35)), (0.3, 0.8 * rustle(0.45))])


def sfx_enf_scintille():
    freqs = sorted(rng.uniform(2200, 6500, 14), reverse=True)
    return place(2.0, [(i * 0.1, 0.6 * ping(f, 0.4, 0.12)) for i, f in enumerate(freqs)])


def sfx_ado_glitch():
    parts, at = [], 0.0
    while at < 0.85:
        seg = rng.uniform(0.03, 0.09)
        tone = square(rng.uniform(90, 1800), seg)
        parts.append((at, np.round(tone * 3) / 3 * rng.uniform(0.4, 1)))  # écrasement de résolution
        at += seg + rng.uniform(0, 0.04)
    return place(1.0, parts)


def sfx_ado_flash():
    click = noise(0.006) * np.linspace(1, 0, int(0.006 * SR))
    whine = 0.25 * sine(glide(2500, 6500, 0.45), 0.45) * decay(0.45, 0.15)
    return place(0.5, [(0.0, click), (0.0, whine)])


def sfx_ado_accel():
    d = 3.0
    t = timeline(d)
    rpm = np.where(t < 1.4, 45 + 80 * t / 1.4, 70 + 110 * (t - 1.4) / 1.6)  # passage de vitesse à 1,4 s
    engine = lowpass(saw(rpm, d) + 0.5 * saw(rpm * 2.01, d), 1400) + 0.15 * lowpass(noise(d), 900)
    return fade_tail(engine * np.minimum(1, t / 0.3) + whoosh(d, 200, 1500, 0.4))


def sfx_ado_bass_hit():
    d = 1.5
    return np.tanh(2.2 * sine(glide(75, 40, d), d) * decay(d, 0.45))


def sfx_ado_rewind():
    d = 1.5
    t = timeline(d)
    freq = glide(1200, 180, d) * (1 + 0.25 * np.sin(2 * np.pi * 14 * t))
    return (0.6 * saw(freq, d) + 0.3 * bandpass(noise(d), 800, 5000)) * bell_env(d)


def sfx_ado_spray():
    rattle = place(0.45, [(k * 0.13, bandpass(noise(0.05), 1500, 6000) * decay(0.05, 0.01)) for k in range(3)])
    hiss = highpass(noise(1.0), 3500) * bell_env(1.0)
    return place(1.5, [(0.0, rattle), (0.45, 0.8 * hiss)])


def sfx_ado_record_scratch():
    d = 0.75
    t = timeline(d)
    rate = 1 + 0.9 * np.sin(2 * np.pi * 3.2 * t)  # va-et-vient du disque
    scratch = lowpass(saw(260 * np.abs(rate) + 40, d) + 0.5 * noise(d), 3500) * bell_env(d)
    return place(1.5, [(0.0, scratch)])  # puis silence : la musique s'arrête net


def sfx_clo_boing():
    d = 1.0
    t = timeline(d)
    freq = 160 + 220 * t + 90 * np.sin(2 * np.pi * 11 * t) * np.exp(-3 * t)
    return sine(freq, d) * decay(d, 0.35)


def sfx_clo_honk():
    def honk(d):
        return lowpass(square(330, d) + square(418, d), 1600) * np.minimum(1, timeline(d) / 0.015) * decay(d, 0.5)
    return fade_tail(place(1.0, [(0.0, honk(0.32)), (0.42, honk(0.4))]))


def sfx_clo_sifflet():
    d = 1.2
    t = timeline(d)
    trill = 0.65 + 0.35 * np.sin(2 * np.pi * 32 * t)  # roulement de la bille du sifflet
    return fade_tail(place(1.5, [(0.0, sine(2850, d) * trill * np.minimum(1, t / 0.03))]))


def sfx_clo_sifflet_coulisse():
    up = sine(glide(480, 1800, 0.6), 0.6)
    down = sine(glide(1800, 600, 0.7), 0.7)
    return fade_tail(place(1.5, [(0.0, up), (0.6, down)]) * 0.8)


def sfx_clo_pop():
    return pop(320, 950, 0.3)


def sfx_clo_splat():
    d = 0.6
    thump = sine(glide(130, 55, d), d) * decay(d, 0.12)
    goo = lowpass(noise(d), 900) * decay(d, 0.18)
    return place(1.5, [(0.0, thump + goo), (0.65, 0.35 * pop(400, 900, 0.2)), (0.95, 0.25 * pop(380, 820, 0.2))])


def sfx_clo_rimshot():
    return place(2.0, [(0.0, snare()), (0.17, 0.8 * snare()), (0.36, 0.7 * snare()), (0.36, 0.6 * crash())])


def sfx_clo_wah_wah():
    notes = [(233.1, 0.45), (220.0, 0.45), (207.7, 0.45), (196.0, 1.4)]
    parts, at = [], 0.0
    for i, (f, d) in enumerate(notes):
        t = timeline(d)
        vibrato = 1 + (0.012 * np.sin(2 * np.pi * 6 * t) if i == 3 else 0)
        wah = 500 + 1300 * np.sin(np.pi * np.minimum(1, t / 0.35)) ** 2  # sourdine qui s'ouvre
        parts.append((at, fade_tail(lowpass(saw(f * vibrato, d), wah) * decay(d, d * 0.9))))
        at += d + 0.05
    return place(3.0, parts)


def sfx_clo_tadaa():
    chord = [261.6, 329.6, 392.0, 523.3]
    stab = fade_tail(brass(chord, 0.22))
    hold = fade_tail(brass(chord, 2.1) * decay(2.1, 1.1))
    return place(3.0, [(0.0, stab), (0.32, hold), (0.32, 0.5 * crash())])


def sfx_out_whoosh_fly():
    shimmer = place(2.0, [(0.2 + i * 0.12, 0.3 * ping(f)) for i, f in enumerate(rng.uniform(2500, 6000, 12))])
    return whoosh(2.0, 400, 5000) + shimmer


def sfx_out_scintille():
    scale = [523.3, 587.3, 659.3, 784.0, 880.0]  # pentatonique ascendante (glissando de harpe)
    notes = [f * 2 ** octave for octave in range(3) for f in scale]
    plucks = [(i * 0.13, 0.5 * ping(f, 1.2, 0.35)) for i, f in enumerate(notes)]
    sparkle = [(0.8 + i * 0.11, 0.2 * ping(f)) for i, f in enumerate(rng.uniform(3000, 7000, 22))]
    return place(4.0, plucks + sparkle)


def sfx_out_feu_artifice():
    parts = []
    for k, at in enumerate([0.0, 1.6, 3.0]):
        whistle = 0.25 * sine(glide(900, 2600, 0.8), 0.8) * bell_env(0.8)
        boom = np.tanh(1.5 * (sine(glide(80, 38, 1.2), 1.2) * decay(1.2, 0.35) + 0.6 * lowpass(noise(1.2), 1500) * decay(1.2, 0.2)))
        crackle = place(1.4, [(rng.uniform(0, 1.2), 0.3 * highpass(noise(0.004), 3000)) for _ in range(60)])
        parts += [(at, whistle), (at + 0.8, boom * (0.8 + 0.1 * k)), (at + 0.9, crackle)]
    return place(6.0, parts)


def sfx_out_applause():
    d = 8.0
    claps = [(rng.uniform(0, d - 0.1), clap() * rng.uniform(0.3, 1)) for _ in range(int(d * 34))]
    room = place(d, claps)
    t = timeline(d)
    return lowpass(room, 6000) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 1.8)


# ---------------------------------------------------------------- ouverture « conversation » (film HyperFrames)
# Sons de messagerie génériques, volontairement différents des sons d'une application réelle.
def sfx_wa_recu():
    """Message reçu : deux notes douces (tierce montante), timbre boisé."""
    def note(f, d=0.32):
        return (sine(f, d) + 0.25 * sine(f * 3.01, d)) * decay(d, 0.07)
    return fade_tail(place(0.5, [(0.0, 0.8 * note(1174.7)), (0.085, note(1479.98))]))


def sfx_wa_envoye():
    """Message envoyé : petit « tic » montant très court."""
    return fade_tail(place(0.3, [(0.0, 0.7 * pop(900, 2200, 0.12))]))


def sfx_wa_tape():
    """Quelqu'un écrit : tapotements feutrés sur un écran (1,3 s)."""
    d = 1.3
    taps = [(at, 0.5 * bandpass(noise(0.012), 1500, 5000) * decay(0.012, 0.003))
            for at in np.cumsum(rng.uniform(0.05, 0.13, 16)) if at < d - 0.05]
    return place(d, taps)


def sfx_wa_vibre():
    """Téléphone qui vibre sur une table : deux salves de 0,42 s."""
    def buzz(d=0.42):
        t = timeline(d)
        motor = square(168 + 6 * np.sin(2 * np.pi * 9 * t), d)
        rattle = bandpass(noise(d), 1800, 4200) * (0.5 + 0.5 * square(42, d))
        env = np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.03)
        return (0.6 * lowpass(motor, 900) + 0.25 * rattle) * env
    return fade_tail(place(1.2, [(0.0, buzz()), (0.62, buzz())]))


def sfx_open_tension():
    """Nappe de tension (36 s, conversation de 19 messages au rythme validé) : drone grave qui enfle, cœur qui accélère, souffle qui s'ouvre.
    Se termine net (suspension) : c'est voulu."""
    d = 36.0
    t = timeline(d)
    swell = 0.25 + 0.75 * (t / d) ** 1.6
    drone = (sine(55, d) + 0.55 * sine(82.6, d) + 0.3 * sine(110.4, d)) * swell
    air = lowpass(highpass(noise(d), 250), glide(400, 2600, d)) * 0.12 * (t / d) ** 2
    beats, at, interval = [], 1.2, 1.0
    while at < d - 0.3:
        lub = sine(glide(72, 42, 0.16), 0.16) * decay(0.16, 0.05)
        dub = 0.7 * sine(glide(64, 40, 0.14), 0.14) * decay(0.14, 0.045)
        beats += [(at, 1.4 * lub), (at + 0.19, 1.4 * dub)]
        at += interval
        interval = max(0.42, interval * 0.975)
    heart = np.tanh(1.5 * place(d, beats))
    return fade_tail(0.55 * drone + air + heart, 0.012)


CATALOG = {
    "SFX_INT_RISER": sfx_int_riser, "SFX_INT_IMPACT": sfx_int_impact, "SFX_INT_WHOOSH": sfx_int_whoosh,
    "SFX_ENF_BULLE_POP": sfx_enf_bulle_pop, "SFX_ENF_CARILLON": sfx_enf_carillon,
    "SFX_ENF_WHOOSH_DOUX": sfx_enf_whoosh_doux, "SFX_ENF_PAGE": sfx_enf_page, "SFX_ENF_SCINTILLE": sfx_enf_scintille,
    "SFX_ADO_GLITCH": sfx_ado_glitch, "SFX_ADO_FLASH": sfx_ado_flash, "SFX_ADO_ACCEL": sfx_ado_accel,
    "SFX_ADO_BASS_HIT": sfx_ado_bass_hit, "SFX_ADO_REWIND": sfx_ado_rewind, "SFX_ADO_SPRAY": sfx_ado_spray,
    "SFX_ADO_RECORD_SCRATCH": sfx_ado_record_scratch,
    "SFX_CLO_BOING": sfx_clo_boing, "SFX_CLO_HONK": sfx_clo_honk, "SFX_CLO_SIFFLET": sfx_clo_sifflet,
    "SFX_CLO_SIFFLET_COULISSE": sfx_clo_sifflet_coulisse, "SFX_CLO_POP": sfx_clo_pop, "SFX_CLO_SPLAT": sfx_clo_splat,
    "SFX_CLO_RIMSHOT": sfx_clo_rimshot, "SFX_CLO_WAH_WAH": sfx_clo_wah_wah, "SFX_CLO_TADAA": sfx_clo_tadaa,
    "SFX_OUT_WHOOSH_FLY": sfx_out_whoosh_fly, "SFX_OUT_SCINTILLE": sfx_out_scintille,
    "SFX_OUT_FEU_ARTIFICE": sfx_out_feu_artifice, "SFX_OUT_APPLAUSE": sfx_out_applause,
    # Ajoutés en fin de catalogue : la graine partagée garde les sons précédents identiques.
    "SFX_WA_RECU": sfx_wa_recu, "SFX_WA_ENVOYE": sfx_wa_envoye, "SFX_WA_TAPE": sfx_wa_tape,
    "SFX_WA_VIBRE": sfx_wa_vibre, "SFX_OPEN_TENSION": sfx_open_tension,
}


def write_wav(path: Path, signal: np.ndarray) -> None:
    peak = np.max(np.abs(signal)) or 1.0
    scaled = signal / peak * 10 ** (PEAK_DBFS / 20)
    pcm = (np.clip(scaled, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for sfx_id, make in CATALOG.items():
        signal = make()
        write_wav(OUT / f"{sfx_id}.wav", signal)
        print(f"{sfx_id:28s} {len(signal) / SR:4.2f} s")
    print(f"OK : {len(CATALOG)} bruitages dans {OUT}")


if __name__ == "__main__":
    main()
