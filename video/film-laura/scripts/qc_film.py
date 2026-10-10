#!/usr/bin/env python3
"""Contrôle qualité du MP4 final (ffprobe/ffmpeg + numpy) → RAPPORT_QC.md (section mesures).

Usage :  python video/film-laura/scripts/qc_film.py [renders/laura-18-ans-film.mp4]
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

FILM = Path(__file__).resolve().parents[1]
DEFAULT_MP4 = FILM / "renders" / "laura-18-ans-film.mp4"
EXPECTED = {"width": 1920, "height": 1080, "fps": 30.0, "duration": 360.0}
SCENE_MIDPOINTS = [6, 13, 21, 60, 110, 150, 200, 270, 320, 346, 355]
SCENE_CUTS = [24, 125, 230, 335]
LOUDNESS_TARGET = (-18.0, -12.0)  # timeline.json vise -16 LUFS
TRUE_PEAK_MAX = -1.0


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        raise SystemExit(f"Échec : {' '.join(cmd[:3])}…\n{result.stderr[-800:]}")
    return result.stdout + result.stderr


def probe(mp4: Path) -> dict:
    data = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(mp4)]))
    video = next(s for s in data["streams"] if s["codec_type"] == "video")
    audio = next((s for s in data["streams"] if s["codec_type"] == "audio"), None)
    num, den = video["r_frame_rate"].split("/")
    return {
        "duration": float(data["format"]["duration"]),
        "size_mb": int(data["format"]["size"]) / 1e6,
        "width": video["width"],
        "height": video["height"],
        "fps": float(num) / float(den),
        "vcodec": video["codec_name"],
        "acodec": audio["codec_name"] if audio else None,
        "sample_rate": int(audio["sample_rate"]) if audio else None,
    }


def loudness(mp4: Path) -> dict:
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(mp4), "-af", "ebur128=peak=true", "-f", "null", "-"])
    summary = out[out.rfind("Summary:"):]
    grab = lambda label: float(re.search(rf"{label}:\s+(-?[\d.]+)", summary).group(1))
    return {"integrated": grab("I"), "lra": grab("LRA"), "true_peak": grab("Peak")}


def black_segments(mp4: Path) -> list[tuple[float, float]]:
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(mp4), "-vf", "blackdetect=d=0.25:pix_th=0.06", "-an", "-f", "null", "-"])
    return [(float(a), float(b)) for a, b in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", out)]


def silences(mp4: Path) -> list[tuple[float, float]]:
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(mp4), "-af", "silencedetect=n=-45dB:d=0.4", "-vn", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(starts, ends))


def voice_emergence(mp4: Path, index_html: Path) -> list[tuple[str, float, float]]:
    """Niveau (dB RMS) pendant chaque réplique vs juste avant : la voix doit émerger de la musique."""
    html = index_html.read_text(encoding="utf-8")
    cues = [(m.group(1), float(m.group(2)), float(m.group(3)))
            for m in re.finditer(r'<audio [^>]*\bid="(vo-[^"]+)"[^>]*data-start="([\d.]+)" data-duration="([\d.]+)"', html)]
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "mix.wav"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-ac", "1", "-ar", "16000", str(wav)])
        with wave.open(str(wav)) as w:
            sr = w.getframerate()
            x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float) / 32768
    level = lambda a, b: 20 * np.log10(np.sqrt(np.mean(x[int(a * sr):int(b * sr)] ** 2)) + 1e-9)
    return [(cue_id, level(start, start + dur), level(max(0, start - 2.5), start - 0.3)) for cue_id, start, dur in cues]


def contact_sheet(mp4: Path, out_png: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        frames = []
        for i, t in enumerate(SCENE_MIDPOINTS):
            f = Path(tmp) / f"f{i:02d}.png"
            run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=480:-1", str(f)])
            frames.append(f)
        frames.append(frames[-1])  # 12 cases pour une grille 4×3
        inputs = sum([["-i", str(f)] for f in frames], [])
        rows = "".join(f"[{4 * r}][{4 * r + 1}][{4 * r + 2}][{4 * r + 3}]hstack=4[r{r}];" for r in range(3))
        run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", rows + "[r0][r1][r2]vstack=3", str(out_png)])


def main() -> None:
    mp4 = (Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_MP4).resolve()
    if not mp4.exists():
        raise SystemExit(f"Fichier introuvable : {mp4}")
    info, loud = probe(mp4), loudness(mp4)
    blacks, quiet = black_segments(mp4), silences(mp4)
    voices = voice_emergence(mp4, FILM / "index.html")
    sheet = FILM / "snapshots" / "qc-planche-film.png"
    sheet.parent.mkdir(exist_ok=True)
    contact_sheet(mp4, sheet)

    ok = lambda cond: "✅" if cond else "⚠️"
    lines = [
        "## Mesures automatiques (scripts/qc_film.py)",
        "",
        f"Fichier : `{mp4.relative_to(FILM).as_posix()}` — {info['size_mb']:.1f} Mo",
        "",
        "| Contrôle | Mesure | Attendu | |",
        "|---|---|---|---|",
        f"| Durée | {info['duration']:.2f} s | {EXPECTED['duration']:.0f} s | {ok(abs(info['duration'] - EXPECTED['duration']) < 0.1)} |",
        f"| Image | {info['width']}×{info['height']} @ {info['fps']:.2f} i/s, {info['vcodec']} | 1920×1080 @ 30 | {ok(info['width'] == 1920 and info['height'] == 1080 and abs(info['fps'] - 30) < 0.01)} |",
        f"| Son | {info['acodec']} {info['sample_rate']} Hz | AAC 48 kHz | {ok(info['acodec'] == 'aac')} |",
        f"| Loudness intégrée | {loud['integrated']:.1f} LUFS | {LOUDNESS_TARGET[0]:.0f} à {LOUDNESS_TARGET[1]:.0f} LUFS | {ok(LOUDNESS_TARGET[0] <= loud['integrated'] <= LOUDNESS_TARGET[1])} |",
        f"| Crête vraie | {loud['true_peak']:.1f} dBTP | ≤ {TRUE_PEAK_MAX:.0f} dBTP | {ok(loud['true_peak'] <= TRUE_PEAK_MAX + 0.05)} |",
        f"| Plage de loudness | {loud['lra']:.1f} LU | — | |",
        "",
        "**Passages noirs (≥ 0,25 s)** : " + (", ".join(f"{a:.2f}–{b:.2f} s" for a, b in blacks) or "aucun"),
        "",
        "**Silences (< −45 dB, ≥ 0,4 s)** : " + (", ".join(f"{a:.2f}–{b:.2f} s" for a, b in quiet) or "aucun"),
        "",
        "**Émergence de la voix off** (RMS pendant la réplique vs 2,5 s avant) :",
        "",
        "| Réplique | Pendant | Avant | Écart |",
        "|---|---|---|---|",
        *[f"| {cid} | {during:.1f} dB | {before:.1f} dB | {during - before:+.1f} dB |" for cid, during, before in voices],
        "",
        f"Planche des milieux de scène : `snapshots/{sheet.name}` (instants, en s : {', '.join(str(t) for t in SCENE_MIDPOINTS)})",
    ]
    out = FILM / "snapshots" / "qc-mesures.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
