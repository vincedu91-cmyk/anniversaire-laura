#!/usr/bin/env python3
"""Découpe la prise complète de la voix off en une réplique par fichier.

Usage :  python voix-off/decouper_voix.py
Entrée : assets/audio/vo/VO_HUGO_COMPLET.mp3 + voix-off/coupes_hugo.json (coupes calées sur
         la transcription Parakeet, dans les pauses entre deux répliques)
Sortie : assets/audio/vo/<VO_ID>.mp3, puis relancer generate_timeline.py pour prendre les durées.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "audio" / "vo" / "VO_HUGO_COMPLET.mp3"
CUTS = Path(__file__).resolve().parent / "coupes_hugo.json"
FADE_S = 0.015  # micro-fondus pour éviter les clics aux coupes


def cut(start: float, end: float, target: Path) -> None:
    duration = end - start
    fades = f"afade=t=in:d={FADE_S},afade=t=out:st={duration - FADE_S:.3f}:d={FADE_S}"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{duration:.3f}", "-i", str(SOURCE),
         "-af", fades, "-c:a", "libmp3lame", "-q:a", "2", str(target)],
        check=True,
    )


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # console Windows en cp1252
    spec = json.loads(CUTS.read_text(encoding="utf-8"))
    ids, cuts = spec["ids"], spec["cuts"]
    if len(cuts) != len(ids) + 1:
        raise ValueError(f"{len(ids)} répliques mais {len(cuts)} coupes (attendu {len(ids) + 1})")
    for vid, start, end in zip(ids, cuts, cuts[1:]):
        cut(start, end, SOURCE.parent / f"{vid}.mp3")
        print(f"{vid:10s} {start:7.2f} → {end:7.2f}  ({end - start:5.2f} s)")
    print(f"OK : {len(ids)} répliques dans {SOURCE.parent}")


if __name__ == "__main__":
    main()
