#!/usr/bin/env python3
"""Assemble le film HyperFrames « Et puis il y a Laura, quoi… » à partir de timeline.json.

Usage (depuis la racine du dépôt) :
    python generate_timeline.py                  # 1. plan de montage (photos, musiques, voix, SFX)
    python video/film-laura/scripts/build_film.py   # 2. assemblage HyperFrames
    python video/film-laura/scripts/build_film.py --until 45.4   # ouverture seule (prévisualisation)

Ce que fait le script :
- recale le plan sur la nouvelle ouverture « conversation » (45,4 s au lieu de l'intro de 20 s) :
  la partie Enfance (20–125 s du plan) dure 101 s à partir de 45,4 s ; tout ce qui suit est décalé
  de +21,4 s — film de 6:21 (choix validés les 9 et 10 oct. 2026) ;
- copie les photos/vidéos réellement présentes dans photos/<dossier> vers assets/photos/<univers>/ ;
  sans photo, l'emplacement reste un cadre « PHOTO À VENIR » (aucun souvenir n'est inventé) ;
- réécrit les régions générées des compositions (<!-- SLOTS:BEGIN --> … <!-- SLOTS:END -->,
  <!-- BURST:BEGIN --> … <!-- BURST:END -->) ;
- régénère index.html : hôtes des scènes + toutes les pistes audio (musiques, voix off, SFX).
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
from pathlib import Path

FILM = Path(__file__).resolve().parents[1]
REPO = FILM.parents[1]
TIMELINE = REPO / "timeline.json"

OLD_INTRO_END = 20.0  # fin de l'intro dans timeline.json
ENFANCE_END = 125.0  # fin de la partie Enfance dans timeline.json
OPENING_END = 45.4  # ouverture « conversation » (19 messages, rythme « modéré » validé)
ENFANCE_LEN = 101.0  # durée de l'univers 01 dans le film
ENFANCE_K = ENFANCE_LEN / (ENFANCE_END - OLD_INTRO_END)
SHIFT = OPENING_END + ENFANCE_LEN - ENFANCE_END  # décalage de tout ce qui suit l'Enfance (+11 s)
FILM_END = 360.0 + SHIFT
PRE_ROLL_S = 1.5  # un SFX de transition peut démarrer jusqu'à 1,5 s avant sa coupe

PHOTO_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
VIDEO_EXTS = {".mp4", ".mov", ".webm"}

# Univers du film : id timeline → (id composition, fichier, libellé de dossier)
UNIVERS = {
    "enfance": ("enfance", "compositions/univers-enfance.html", "Naissance-Enfance"),
    "ado": ("ado", "compositions/univers-ado.html", "Adolescence"),
    "clown": ("betises", "compositions/univers-betises.html", "Laura-le-petit-clown"),
}
SCENES = [  # (id composition, fichier, début, fin)
    ("opening", "compositions/opening.html", 0.0, OPENING_END),
    ("enfance", "compositions/univers-enfance.html", OPENING_END, OPENING_END + ENFANCE_LEN),
    ("ado", "compositions/univers-ado.html", 125.0 + SHIFT, 230.0 + SHIFT),
    ("betises", "compositions/univers-betises.html", 230.0 + SHIFT, 335.0 + SHIFT),
    ("finale", "assets/video/finale/FINALE_REMOTION.mp4", 335.0 + SHIFT, FILM_END),  # rendu Remotion (muet)
]
REMOTION = REPO / "video" / "remotion-finale"

# Bruitages de l'ouverture (temps du film, s). Le reste vient de timeline.json.
OPENING_SFX = [
    # (asset, début, gain dB, media_start, durée ou None)
    ("SFX_INT_WHOOSH", 0.2, -16, 0.0, None),
    ("SFX_OPEN_TENSION", 0.0, -9, 0.4, 35.6),  # coupe nette à 35,6 s = suspension
    ("SFX_WA_TAPE", 33.0, -14, 0.0, 0.95),  # « écrit… », s'arrête avant la dernière bulle
    ("SFX_WA_VIBRE", 35.6, -3, 0.0, None),
    ("SFX_INT_RISER", 37.1, -7, 2.2, 2.75),  # finit pile sur l'impact
    ("SFX_INT_WHOOSH", 39.3, -4, 0.0, None),
    ("SFX_INT_IMPACT", 39.85, -2, 0.0, None),
    ("SFX_ENF_SCINTILLE", 42.25, -15, 0.0, None),
    ("SFX_ENF_WHOOSH_DOUX", 44.4, -12, 0.0, None),
]
MSG_SOUND = {"in": ("SFX_WA_RECU", -9), "out": ("SFX_WA_ENVOYE", -10)}
FINAL_MSG_GAIN_DB = -4
# Point d'entrée des morceaux (timeline.json : « point d'entrée à ajuster si besoin »).
# La Boulette commence par ~9 s d'ambiance quasi muette (intro du clip) : on entre sur la musique.
MUSIC_MEDIA_START = {"MUS_ADO": 9.0}
# Bruitages retirés (demande du 9 oct. 2026 : « enlève les SFX qui ne servent pas l'animation des photos »
# dans Adolescence et En vrille). Clé = (asset, instant dans timeline.json, avant recalage).
SFX_REMOVED = {
    ("SFX_ADO_RECORD_SCRATCH", 124.0),  # avant l'univers : aucune photo à l'écran
    ("SFX_ADO_ACCEL", 134.733),  # moteur de 3 s sur un whip pan de 0,45 s (ADO_003)
    ("SFX_ADO_REWIND", 144.733),  # ADO_005 est un collage qui claque, pas un effet VHS
    ("SFX_ADO_ACCEL", 174.733),  # whip pan ADO_009
    ("SFX_ADO_ACCEL", 214.733),  # ADO_015 est un collage
    ("SFX_CLO_SIFFLET", 254.733),  # sifflet d'arbitre sur un squash & stretch (CLO_006)
    ("SFX_CLO_SIFFLET", 284.733),  # CLO_012
    ("SFX_CLO_SIFFLET", 314.733),  # CLO_018
    ("SFX_CLO_RIMSHOT", 252.5),  # gags isolés, sans mouvement de photo
    ("SFX_CLO_WAH_WAH", 280.0),
    ("SFX_CLO_RIMSHOT", 305.5),
    ("SFX_OUT_APPLAUSE", 322.0),
    ("SFX_CLO_TADAA", 332.0),  # accompagnait le tampon « DOSSIER CLASSÉ », pas une photo (retiré à la validation)
}
# Recalages validés : le splat tombe quand la photo s'écrase sur le bureau (atterrissage à +0,45 s de son
# entrée, timeline.json le plaçait 0,4 s avant l'entrée).
SFX_OFFSET = {"SFX_CLO_SPLAT": 0.85}


def sfx_removed(asset: str, at: float) -> bool:
    return any(asset == a and abs(at - t) < 0.05 for a, t in SFX_REMOVED)


TENSION_FADE_IN_S = 1.2
SFX_TRACK = 22  # premières pistes de bruitages (22, 23, …)
# Sous la voix off : carve (hyperframes-audio) + atténuation. Mesuré sur le rendu v1 (rapport voix/fond) :
# le carve seul laissait ADO_03/04 et CLO_03/04 entre +1,6 et +4,5 dB, et OUT_02 à −0,4 dB (feu d'artifice).
MUSIC_DUCK_DB = -6
SFX_UNDER_VOICE_DB = -6  # bruitages qui chevauchent une réplique
CARVE_SCRIPT = Path.home() / ".claude" / "skills" / "hyperframes-audio" / "scripts" / "carve.mjs"
DUCK_ATTACK_S, DUCK_RELEASE_S = 0.25, 0.6

# Cartes de l'explosion de photos (ouverture) : univers, cible x/y (px depuis le centre), rotation, échelle.
BURST = [
    ("enfance", -700, -300, -8, 0.92), ("ado", -330, -360, 5, 0.86), ("betises", 60, -330, -4, 0.9),
    ("enfance", 430, -350, 7, 0.88), ("ado", 760, -280, -6, 0.9), ("betises", -800, 60, 6, 0.95),
    ("ado", -470, 20, -3, 1.0), ("enfance", -90, 30, 4, 1.04), ("betises", 300, 10, -7, 0.98),
    ("enfance", 690, 70, 5, 0.94), ("betises", -620, 380, -5, 0.9), ("enfance", -220, 390, 8, 0.88),
    ("ado", 170, 380, -2, 0.92), ("enfance", 560, 400, -8, 0.9),
]
BURST_LABELS = {"enfance": "ENFANCE", "ado": "ADOLESCENCE", "betises": "EN VRILLE"}


# ---------------------------------------------------------------- temps
def remap(t: float) -> float:
    """Temps timeline.json → temps du film : Enfance recalée après l'ouverture, la suite décalée de SHIFT."""
    if OLD_INTRO_END <= t <= ENFANCE_END:
        return OPENING_END + (t - OLD_INTRO_END) * ENFANCE_K
    if t > ENFANCE_END:
        return t + SHIFT
    if OLD_INTRO_END - PRE_ROLL_S <= t < OLD_INTRO_END:  # SFX anticipés de l'entrée en Enfance
        return t + (OPENING_END - OLD_INTRO_END)
    return t


def r3(x: float) -> float:
    return round(x + 0.0, 3)


def db(gain_db: float) -> float:
    return round(10 ** (gain_db / 20), 4)


# ---------------------------------------------------------------- médias personnels
def media_for(source: dict, univers: str) -> dict:
    """Copie le fichier source dans le projet s'il existe ; sinon renvoie un emplacement vide."""
    if not source or source.get("placeholder"):
        return {"kind": "placeholder"}
    src = REPO / source["folder"] / source["file"]
    ext = src.suffix.lower()
    if not src.is_file() or ext not in PHOTO_EXTS | VIDEO_EXTS:
        print(f"  ! ignoré (absent ou format non lu par le navigateur) : {src.relative_to(REPO)}", file=sys.stderr)
        return {"kind": "placeholder"}
    dst_dir = FILM / "assets" / "photos" / univers
    dst_dir.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^A-Za-z0-9._-]+", "-", src.name)
    dst = dst_dir / safe
    if not dst.exists() or dst.stat().st_size != src.stat().st_size:
        shutil.copy2(src, dst)
    return {"kind": "video" if ext in VIDEO_EXTS else "photo", "src": dst.relative_to(FILM).as_posix()}


def media_html(media: dict, n: int, univers: str, folder: str, local_at: float, dur: float, vid_id: str) -> str:
    if media["kind"] == "photo":
        # Fond flou (même image) + image entière : aucune photo n'est rognée, quel que soit son format.
        src = html.escape(media["src"])
        return f'<img class="m-bg" src="{src}" alt="" /><img class="m-fg" src="{src}" alt="" />'
    if media["kind"] == "video":
        return (f'<video id="{vid_id}" class="m-fg" src="{html.escape(media["src"])}" muted playsinline '
                f'data-start="{r3(local_at)}" data-duration="{r3(dur)}"></video>')
    # Les emplacements se croisent pendant les fondus enchaînés : chevauchement voulu.
    return (f'<div class="ph"><b data-layout-allow-overlap>{n:02d}</b><span data-layout-allow-overlap>PHOTO À VENIR</span>'
            f'<i data-layout-allow-overlap>photos/{html.escape(folder)}</i></div>')


# ---------------------------------------------------------------- régions générées
def replace_region(path: Path, name: str, content: str) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"(<!-- {name}:BEGIN[^>]*-->)(.*?)(\s*<!-- {name}:END -->)", re.S)
    if not pattern.search(text):
        raise SystemExit(f"Région {name} introuvable dans {path}")
    indent = re.search(rf"\n([ \t]*)<!-- {name}:BEGIN", text).group(1)
    body = "".join(f"\n{indent}{line}" for line in content.splitlines() if line.strip())
    new = pattern.sub(lambda m: m.group(1) + body + m.group(3), text)
    if new != text:
        path.write_text(new, encoding="utf-8")
    return True


def slot_attrs(clip: dict, extra: dict) -> str:
    attrs = {**extra}
    for e in clip.get("effects", []):
        if e["type"] == "neon_frame":
            attrs["accent"] = e["color"]
        elif e["type"] in ("texte_street_art", "bulle_bd_popup") and e.get("text"):
            attrs["text"] = e["text"]
        elif e["type"] == "ralenti_comique":
            attrs["freeze"] = "1"
    tr = (clip.get("transition_in") or {}).get("style")
    if tr:
        attrs["tr"] = tr
    return " ".join(f'data-{k}="{html.escape(str(v))}"' for k, v in attrs.items())


def build_slots(section: dict, comp_id: str, scene_start: float) -> tuple[str, list[dict]]:
    folder = UNIVERS[section["id"]][2]
    lines, photos = [], []
    for n, clip in enumerate(section["clips"], start=1):
        start, end = remap(clip["start"]), remap(clip["end"])
        local_at, dur = start - scene_start, end - start
        sources = clip.get("sources") or [clip.get("source")]
        kind = "collage" if clip.get("type") == "collage" else "single"
        inner = []
        for k, source in enumerate(sources):
            media = media_for(source, comp_id)
            photos.append(media)
            label = int(re.sub(r"\D", "", (source or {}).get("file", "")) or n)  # numéro du fichier attendu
            body = media_html(media, label, comp_id, folder, local_at, dur, f"{comp_id}-v{n:02d}{k}")
            inner.append(f'<div class="slot-media"><div class="m-frame"><div class="m-kb">{body}</div></div></div>')
        attrs = slot_attrs(clip, {"n": n, "at": r3(local_at), "dur": r3(dur), "kind": kind})
        lines.append(f'<div class="slot" {attrs}>{"".join(inner)}</div>')
    return "\n".join(lines), photos


def build_burst(pool: dict[str, list[dict]]) -> str:
    used = {k: 0 for k in pool}
    lines = []
    for univers, tx, ty, rot, scale in BURST:
        real = [m for m in pool.get(univers, []) if m["kind"] == "photo"]
        i = used[univers]
        used[univers] += 1
        if real:
            pic = f'<img src="{html.escape(real[i % len(real)]["src"])}" alt="" />'
        else:
            pic = f'<div class="ph"><b>{i + 1:02d}</b><span>PHOTO À VENIR</span></div>'
        lines.append(
            f'<div class="op-card {univers}" data-layout-ignore data-tx="{tx}" data-ty="{ty}" data-rot="{rot}" data-scale="{scale}">'
            f'<div class="op-pic">{pic.replace("ph", "op-ph", 1) if not real else pic}</div>'
            f'<span class="op-cap">{BURST_LABELS[univers]}</span></div>'
        )
    return "\n".join(lines)


# ---------------------------------------------------------------- audio
def lane(points: list[tuple[float, float]]) -> str:
    pts = []
    for t, v in sorted(points):
        if pts and abs(pts[-1]["t"] - t) < 1e-4:
            pts[-1] = {"t": r3(t), "v": round(v, 4)}
        else:
            pts.append({"t": r3(t), "v": round(v, 4)})
    data = json.dumps({"version": 1, "lanes": [{"target": "volume", "points": pts}]}, separators=(",", ":"))
    return html.escape(data, quote=True)


def audio_tag(el_id: str, src: str, start: float, duration: float, track: int, *, volume: float = 1.0,
              media_start: float = 0.0, group: str | None = None, automation: str | None = None,
              extra: str = "") -> str:
    parts = [f'<audio id="{el_id}"', f'src="{src}"', f'data-start="{r3(start)}"', f'data-duration="{r3(duration)}"',
             f'data-track-index="{track}"', f'data-volume="{round(volume, 4)}"']
    if media_start:
        parts.append(f'data-media-start="{r3(media_start)}"')
    if group:
        parts.append(f'data-audio-group="{group}"')
    if automation:
        parts.append(f'data-automation="{automation}"')
    if extra:
        parts.append(extra)
    return " ".join(parts) + "></audio>"


def wav_duration(path: Path) -> float:
    import wave
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def build_audio(data: dict, until: float, opening_msgs: list[tuple[str, float]]) -> list[str]:
    audio = data["audio"]
    out: list[str] = []

    # Voix off (Hugo) — l'intro d'origine est remplacée par la conversation : VO_INT_01 n'est plus utilisée.
    vo_windows = []
    for cue in audio.get("voice_over", []):
        if cue["start"] < OLD_INTRO_END:
            continue
        start = remap(cue["start"])
        if start >= until:
            continue
        dur = min(cue["duration"], until - start)
        vo_windows.append((start, start + dur))
        out.append(audio_tag(f"vo-{cue['asset'].lower().replace('_', '-')}", f"assets/audio/vo/{cue['asset']}.mp3",
                             start, dur, 21, volume=db(cue.get("gain_db", 0)), group="voiceover"))

    # Musiques : niveau de base + fondus + atténuation sous la voix, tout dans l'enveloppe (fader à 1).
    for k, m in enumerate(audio["music"], start=1):
        start, end = remap(m["start"]), remap(m["end"])
        if start >= until:
            continue
        end = min(end, until)
        dur = end - start
        base = db(m.get("gain_db", 0))
        ducked = base * db(MUSIC_DUCK_DB)
        pts = [(0, 0 if m.get("fade_in_s") else base), (m.get("fade_in_s", 0) or 0.001, base)]
        for a, b in vo_windows:
            if b <= start or a >= end:
                continue
            la, lb = max(0.0, a - start - DUCK_ATTACK_S), min(dur, b - start)
            pts += [(la, base), (la + DUCK_ATTACK_S, ducked), (lb, ducked), (min(dur, lb + DUCK_RELEASE_S), base)]
        fade_out = m.get("fade_out_s", 0) or 0.05
        pts += [(max(0.0, dur - fade_out), base), (dur, 0)]
        out.append(audio_tag(f"music-{k}-{m['asset'].lower().replace('_', '-')}",
                             f"assets/audio/music/{m['asset']}.mp3", start, dur, 20, volume=1,
                             media_start=MUSIC_MEDIA_START.get(m["asset"], m.get("media_start_s", 0)),
                             group="music", automation=lane(pts)))

    # Bruitages : ouverture (messages + dramaturgie), puis timeline.json (globaux + par plan).
    cues: list[tuple[str, float, float, float, float | None]] = []
    for side, at in opening_msgs:
        asset, gain = MSG_SOUND[side]
        cues.append((asset, at, gain, 0.0, None))
    cues[-1] = (MSG_SOUND["in"][0], opening_msgs[-1][1], FINAL_MSG_GAIN_DB, 0.0, None)  # dernier message, plus fort
    cues += OPENING_SFX
    for s in audio.get("sfx_global", []):
        if s["at"] >= OLD_INTRO_END and not sfx_removed(s["asset"], s["at"]):
            cues.append((s["asset"], remap(s["at"]), s.get("gain_db", 0), 0.0, None))
    for section in data["sections"]:
        if section["id"] == "intro":
            continue
        for clip in section["clips"]:
            for s in clip.get("sfx", []):
                if not sfx_removed(s["asset"], s["at"]):
                    at = remap(s["at"]) + SFX_OFFSET.get(s["asset"], 0.0)
                    cues.append((s["asset"], at, s.get("gain_db", 0), 0.0, None))

    lanes: list[float] = []  # fin du dernier son de chaque piste de bruitages (pas de chevauchement par piste)
    for i, (asset, at, gain, media_start, dur) in enumerate(sorted(cues, key=lambda c: c[1]), start=1):
        if at >= until:
            continue
        path = REPO / "assets" / "audio" / "sfx" / f"{asset}.wav"
        if not path.exists():
            raise SystemExit(f"SFX manquant : {path} (lancer python generate_sfx.py)")
        length = dur if dur is not None else wav_duration(path) - media_start
        length = min(length, until - at)
        if any(at < b and at + length > a for a, b in vo_windows):
            gain += SFX_UNDER_VOICE_DB
        automation = None
        if asset == "SFX_OPEN_TENSION":
            automation = lane([(0, 0), (TENSION_FADE_IN_S, 1), (length, 1)])
        lane_i = next((k for k, busy_until in enumerate(lanes) if busy_until <= at), len(lanes))
        if lane_i == len(lanes):
            lanes.append(0.0)
        lanes[lane_i] = at + length
        out.append(audio_tag(f"sfx-{i:03d}-{asset.lower().replace('_', '-')}", f"assets/audio/sfx/{asset}.wav",
                             max(0.0, at), length, SFX_TRACK + lane_i, volume=db(gain), media_start=media_start, group="sfx",
                             automation=automation))
    return out


def link_audio_assets() -> None:
    """Le projet HyperFrames lit les sons depuis son propre dossier assets/ (copie si besoin)."""
    for sub in ("music", "vo", "sfx"):
        src_dir = REPO / "assets" / "audio" / sub
        dst_dir = FILM / "assets" / "audio" / sub
        dst_dir.mkdir(parents=True, exist_ok=True)
        for src in src_dir.glob("*.*"):
            if src.suffix.lower() not in {".mp3", ".wav"}:
                continue
            dst = dst_dir / src.name
            if not dst.exists() or dst.stat().st_size != src.stat().st_size or dst.stat().st_mtime < src.stat().st_mtime:
                shutil.copy2(src, dst)


def link_video_assets() -> None:
    src_dir = REPO / "assets" / "video" / "enfance"
    dst_dir = FILM / "assets" / "video" / "enfance"
    dst_dir.mkdir(parents=True, exist_ok=True)
    for src in src_dir.glob("*.mp4"):
        dst = dst_dir / src.name
        if not dst.exists() or dst.stat().st_size != src.stat().st_size:
            shutil.copy2(src, dst)


def write_remotion_photos(pool: dict[str, list[dict]]) -> None:
    """Interface HyperFrames → Remotion : les photos réelles du film alimentent la mosaïque du final.
    Après un changement, relancer le rendu Remotion (voir README)."""
    public = REMOTION / "public" / "photos"
    public.mkdir(parents=True, exist_ok=True)
    photos = []
    for univers in ("enfance", "ado", "betises"):
        for media in pool.get(univers, []):
            if media["kind"] != "photo":
                continue
            src = FILM / media["src"]
            dst = public / f"{univers}-{src.name}"
            if not dst.exists() or dst.stat().st_size != src.stat().st_size:
                shutil.copy2(src, dst)
            photos.append(f"photos/{dst.name}")
    target = REMOTION / "src" / "photos.generated.json"
    content = json.dumps({"photos": photos}, ensure_ascii=False, indent=2) + "\n"
    if not target.exists() or target.read_text(encoding="utf-8") != content:
        target.write_text(content, encoding="utf-8")
        print(f"Remotion : {len(photos)} photo(s) pour la mosaïque → relancer le rendu du final")


# ---------------------------------------------------------------- index.html
INDEX_TEMPLATE = """<!doctype html>
<!-- GÉNÉRÉ par scripts/build_film.py à partir de timeline.json — modifier le script, pas ce fichier. -->
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Et puis il y a Laura, quoi… — 18 ans</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }}
      html,
      body {{
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background: #0d0d11;
      }}
      #root {{
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }}
      .scene {{
        position: absolute;
        inset: 0;
      }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{duration}" data-width="1920" data-height="1080">
      <!-- Scènes (une sous-composition par séquence) -->
{scenes}

      <!-- Audio : musiques (piste 20), voix off (21), bruitages (22 et suivantes) -->
{audio}
    </div>
    <script>
      // Les scènes ont chacune leur propre timeline ; la racine ne fait qu'héberger.
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--until", type=float, default=FILM_END, help="fin du rendu (s) — ex. 24 pour l'ouverture seule")
    args = parser.parse_args()
    until = min(args.until, FILM_END)

    data = json.loads(TIMELINE.read_text(encoding="utf-8"))
    sections = {s["id"]: s for s in data["sections"]}
    link_audio_assets()
    link_video_assets()

    # Emplacements photo des univers
    pool: dict[str, list[dict]] = {}
    for tl_id, (comp_id, rel, _folder) in UNIVERS.items():
        scene_start = next(s[2] for s in SCENES if s[0] == comp_id)
        markup, photos = build_slots(sections[tl_id], comp_id, scene_start)
        pool[comp_id] = photos
        written = replace_region(FILM / rel, "SLOTS", markup)
        real = sum(1 for p in photos if p["kind"] != "placeholder")
        print(f"{comp_id:9s} {len(photos):3d} emplacements, {real:3d} médias réels" + ("" if written else "  (composition absente)"))

    # Explosion de photos de l'ouverture
    replace_region(FILM / "compositions/opening.html", "BURST", build_burst(pool))
    opening_text = (FILM / "compositions/opening.html").read_text(encoding="utf-8")
    opening_msgs = [(side, float(at)) for side, at in
                    re.findall(r'class="op-msg (in|out)[^"]*"[^>]*data-at="([\d.]+)"', opening_text)]

    write_remotion_photos(pool)

    # index.html
    scenes = []
    for i, (comp_id, rel, start, end) in enumerate(SCENES):
        if start >= until or not (FILM / rel).exists():
            continue
        end = min(end, until)
        if rel.endswith(".mp4"):  # séquence produite par Remotion : simple plan vidéo muet
            scenes.append(
                f'      <video id="{comp_id}" class="scene clip" src="{rel}" muted playsinline '
                f'data-start="{r3(start)}" data-duration="{r3(end - start)}" data-track-index="{i + 1}"></video>'
            )
            continue
        scenes.append(
            f'      <div id="{comp_id}" class="scene" data-composition-id="{comp_id}" data-composition-src="{rel}" '
            f'data-start="{r3(start)}" data-duration="{r3(end - start)}" data-track-index="{i + 1}" '
            f'data-track-kind="graphics" data-width="1920" data-height="1080"></div>'
        )
    duration = max(float(s.split('data-start="')[1].split('"')[0]) + float(s.split('data-duration="')[1].split('"')[0])
                   for s in scenes)
    audio = [a for a in build_audio(data, duration, opening_msgs)]
    (FILM / "index.html").write_text(
        INDEX_TEMPLATE.format(duration=r3(duration), scenes="\n".join(scenes),
                              audio="\n".join("      " + a for a in audio)),
        encoding="utf-8",
    )
    print(f"index.html : {len(scenes)} scènes, {len(audio)} pistes audio, durée {duration:.2f} s")
    carve_music_beds()
    write_timeline_md(audio, duration)


def write_timeline_md(audio: list[str], duration: float) -> None:
    """TIMELINE.md : la timeline audiovisuelle réellement assemblée (générée, toujours à jour)."""
    def tc(t: float) -> str:
        return f"{int(t // 60)}:{t % 60:05.2f}"

    def attr(tag: str, name: str) -> str:
        m = re.search(rf'{name}="([^"]*)"', tag)
        return m.group(1) if m else ""

    lines = [
        "# Timeline audiovisuelle — « Et puis il y a Laura, quoi… »",
        "",
        "> Généré par `scripts/build_film.py` à partir de `timeline.json` — ne pas éditer à la main.",
        "",
        f"Durée : **{tc(duration)}** · 1920×1080 · 30 i/s",
        "",
        "## Scènes",
        "",
        "| Début | Fin | Scène | Moteur | Source |",
        "|---|---|---|---|---|",
    ]
    for comp_id, rel, start, end in SCENES:
        if start >= duration:
            continue
        engine = "Remotion (MP4 muet)" if rel.endswith(".mp4") else "HyperFrames"
        lines.append(f"| {tc(start)} | {tc(min(end, duration))} | {comp_id} | {engine} | `{rel}` |")
    lines += ["", "## Pistes audio", "", "| Début | Durée | Rôle | Fichier | Volume |", "|---|---|---|---|---|"]
    roles = {"music": "Musique", "voiceover": "Voix off", "sfx": "Bruitage"}
    for tag in sorted(audio, key=lambda a: float(attr(a, "data-start"))):
        lines.append(
            f"| {tc(float(attr(tag, 'data-start')))} | {float(attr(tag, 'data-duration')):.2f} s | "
            f"{roles.get(attr(tag, 'data-audio-group'), '?')} | {attr(tag, 'src').split('/')[-1]} | {attr(tag, 'data-volume')} |"
        )
    (FILM / "TIMELINE.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def carve_music_beds() -> None:
    """Creuse chaque musique sous la voix off (skill hyperframes-audio, scripts/carve.mjs)."""
    import subprocess
    index = (FILM / "index.html").read_text(encoding="utf-8")
    beds = re.findall(r'<audio id="(music-[^"]+)"', index)
    if not CARVE_SCRIPT.exists() or not (FILM / "node_modules" / "@hyperframes" / "core").exists():
        print("  ! carve ignoré (skill hyperframes-audio ou @hyperframes/core absent)", file=sys.stderr)
        return
    for bed in beds:
        result = subprocess.run(["node", str(CARVE_SCRIPT), "--comp", "index.html", "--bed", bed],
                                cwd=FILM, capture_output=True, text=True, encoding="utf-8")
        status = "ok" if result.returncode == 0 else f"ÉCHEC : {result.stderr.strip()[-300:]}"
        print(f"  carve {bed} : {status}")


if __name__ == "__main__":
    main()
