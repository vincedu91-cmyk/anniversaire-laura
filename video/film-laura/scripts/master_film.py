#!/usr/bin/env python3
"""Mastering audio du film : normalisation EBU R128 en deux passes (ffmpeg loudnorm), image copiée.

Usage :  python video/film-laura/scripts/master_film.py renders/laura-18-ans-film-mix.mp4 renders/laura-18-ans-film.mp4
Cible : -16 LUFS intégrés (timeline.json › audio.loudness_target_lufs), crête vraie ≤ -1,5 dBTP.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys

TARGET_I, TARGET_TP, TARGET_LRA = -16.0, -1.5, 11.0


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        raise SystemExit(f"Échec ffmpeg :\n{result.stderr[-1200:]}")
    return result.stderr


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    base = f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}"
    log = run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af", base + ":print_format=json", "-vn", "-f", "null", "-"])
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", log).group(0))
    second = (f"{base}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
              f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", src, "-c:v", "copy", "-af", second,
         "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", dst])
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"Mesuré : {m['input_i']} LUFS, {m['input_tp']} dBTP → {dst} (cible {TARGET_I} LUFS, {TARGET_TP} dBTP)")


if __name__ == "__main__":
    main()
