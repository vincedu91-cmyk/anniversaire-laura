#!/usr/bin/env python3
"""Génère timeline.json pour « LAURA : 18 ANS DE SOUVENIRS » (16:9, 1920x1080, 30 fps, 10 min).

Usage :  python generate_timeline.py

- Scanne ./photos/<sous-dossier>/. Si un dossier est vide ou absent, des noms fictifs
  PHOTO_001.jpg, PHOTO_002.jpg… sont utilisés ("placeholder": true) pour valider la structure.
- Relancer le script après avoir déposé les vraies photos : la durée par photo s'ajuste
  pour que chaque partie conserve exactement sa durée (découpage à l'image près).
- Les identifiants d'assets (BG_*, TR_*, SFX_*, VO_*…) correspondent aux titres de
  higgsfield_prompts.md ; le script vérifie que tout asset référencé est déclaré.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

FPS = 30
WIDTH, HEIGHT = 1920, 1080
ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "timeline.json"

MEDIA_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".mp4", ".mov"}
VIDEO_EXTS = {".mp4", ".mov"}
PLACEHOLDER_COUNT = 36   # 36 photos x 5 s = 180 s par partie
MAX_PER_SECTION = 72     # 2,5 s minimum par photo

SECTION_RANGES = {
    "intro": (0, 30),
    "enfance": (30, 210),
    "ado": (210, 390),
    "clown": (390, 570),
    "outro": (570, 600),
}
FOLDERS = {
    "enfance": "photos/Naissance-Enfance",
    "ado": "photos/Adolescence",
    "clown": "photos/Laura-le-petit-clown",
}
LOOKS = {"enfance": "pastel_soft", "ado": "neon_cyberpunk", "clown": "cartoon_pop"}

# ---------------------------------------------------------------- assets
# (id, dossier, mode de fusion, durée s, boucle)
VIDEO_ASSETS = [
    ("BG_INT_ENERGY", "intro", "normal", 10, True),
    ("TITLE_3D_REVEAL", "intro", "normal", 5, False),
    ("OVL_INT_LIGHT_STREAKS", "intro", "screen", 8, True),
    ("BG_ENF_01_AQUARELLE", "enfance", "normal", 10, True),
    ("BG_ENF_02_BULLES", "enfance", "normal", 10, True),
    ("BG_ENF_03_NUAGES", "enfance", "normal", 10, True),
    ("BG_ENF_04_BALLONS", "enfance", "normal", 10, True),
    ("OVL_ENF_BULLES", "enfance", "screen", 10, True),
    ("OVL_ENF_PARTICULES", "enfance", "screen", 10, True),
    ("TR_ENF_AQUARELLE", "enfance", "luma_matte", 5, False),
    ("TR_ENF_BULLES", "enfance", "luma_matte", 5, False),
    ("TR_ENF_ETOILES", "enfance", "screen", 5, False),
    ("BG_ADO_01_GRILLE_NEON", "ado", "normal", 10, True),
    ("BG_ADO_02_POPART", "ado", "normal", 10, True),
    ("BG_ADO_03_VILLE_NEON", "ado", "normal", 10, True),
    ("BG_ADO_04_GRAFFITI", "ado", "normal", 10, True),
    ("OVL_ADO_NEON_FLARES", "ado", "screen", 10, True),
    ("TR_ADO_GLITCH", "ado", "luma_matte", 5, False),
    ("TR_ADO_WHIP", "ado", "screen", 5, False),
    ("TR_ADO_DEMITEINTE", "ado", "luma_matte", 5, False),
    ("TR_ADO_VHS", "ado", "screen", 5, False),
    ("TR_ADO_SPRAY", "ado", "luma_matte", 5, False),
    ("ELT_ADO_COLLAGE", "ado", "chroma_key", 5, False),
    ("BG_CLO_01_CHAPITEAU", "clown", "normal", 10, True),
    ("BG_CLO_02_BD_RAYONS", "clown", "normal", 10, True),
    ("BG_CLO_03_CONFETTIS", "clown", "normal", 10, True),
    ("STK_CLO_NEZ_ROUGE", "clown", "chroma_key", 3, False),
    ("STK_CLO_YEUX_ROLLING", "clown", "chroma_key", 3, False),
    ("STK_CLO_CHAPEAU_FETE", "clown", "chroma_key", 3, False),
    ("STK_CLO_PERRUQUE_ARC", "clown", "chroma_key", 3, False),
    ("STK_CLO_MOUSTACHE", "clown", "chroma_key", 3, False),
    ("STK_CLO_ETOILES_VERTIGE", "clown", "chroma_key", 3, True),
    ("STK_CLO_LARMES_RIRE", "clown", "chroma_key", 3, False),
    ("STK_CLO_COEURS_YEUX", "clown", "chroma_key", 3, True),
    ("STK_CLO_BULLE_PAROLE", "clown", "chroma_key", 2, False),
    ("STK_CLO_BULLE_CRI", "clown", "chroma_key", 2, False),
    ("TR_CLO_EXPLOSION_BD", "clown", "luma_matte", 5, False),
    ("TR_CLO_TARTE", "clown", "luma_matte", 5, False),
    ("TR_CLO_CONFETTIS", "clown", "screen", 5, False),
    ("BG_OUT_OR_BOKEH", "outro", "normal", 10, True),
    ("OVL_OUT_PAILLETTES", "outro", "screen", 10, True),
    ("OVL_OUT_FEUX_ARTIFICE", "outro", "screen", 10, False),
    ("TITLE_OUT_FINAL", "outro", "normal", 8, False),
]

# (id, BPM, durée cible s)
MUSIC = [
    ("MUS_INTRO", 120, 30), ("MUS_ENFANCE", 100, 180), ("MUS_ADO", 128, 180),
    ("MUS_CLOWN", 120, 180), ("MUS_OUTRO", 72, 30),
]

# (id, début s, durée estimée s, section)
VOICE = [
    ("VO_INT_01", 25.5, 4, "intro"),
    ("VO_ENF_01", 33.0, 10, "enfance"), ("VO_ENF_02", 75.0, 9, "enfance"),
    ("VO_ENF_03", 120.0, 10, "enfance"), ("VO_ENF_04", 165.0, 8, "enfance"),
    ("VO_ENF_05", 199.0, 7, "enfance"),
    ("VO_ADO_01", 212.0, 7, "ado"), ("VO_ADO_02", 258.0, 7, "ado"),
    ("VO_ADO_03", 305.0, 7, "ado"), ("VO_ADO_04", 355.0, 8, "ado"),
    ("VO_CLO_01", 393.0, 8, "clown"), ("VO_CLO_02", 440.0, 8, "clown"),
    ("VO_CLO_03", 490.0, 8, "clown"), ("VO_CLO_04", 540.0, 7, "clown"),
    ("VO_OUT_01", 575.0, 8, "outro"), ("VO_OUT_02", 592.5, 3, "outro"),
]

# (id, durée s)
SFX = [
    ("SFX_INT_RISER", 5), ("SFX_INT_IMPACT", 2), ("SFX_INT_WHOOSH", 1),
    ("SFX_ENF_BULLE_POP", 1), ("SFX_ENF_CARILLON", 2), ("SFX_ENF_WHOOSH_DOUX", 1.5),
    ("SFX_ENF_PAGE", 1), ("SFX_ENF_SCINTILLE", 2), ("SFX_ENF_RIRE_BEBE", 3),
    ("SFX_ADO_GLITCH", 1), ("SFX_ADO_FLASH", 0.5), ("SFX_ADO_ACCEL", 3),
    ("SFX_ADO_BASS_HIT", 1.5), ("SFX_ADO_REWIND", 1.5), ("SFX_ADO_SPRAY", 1.5),
    ("SFX_ADO_RECORD_SCRATCH", 1.5),
    ("SFX_CLO_BOING", 1), ("SFX_CLO_HONK", 1), ("SFX_CLO_SIFFLET", 1.5),
    ("SFX_CLO_SIFFLET_COULISSE", 1.5), ("SFX_CLO_POP", 0.5), ("SFX_CLO_SPLAT", 1.5),
    ("SFX_CLO_RIMSHOT", 2), ("SFX_CLO_WAH_WAH", 3), ("SFX_CLO_TADAA", 3),
    ("SFX_OUT_WHOOSH_FLY", 2), ("SFX_OUT_SCINTILLE", 4), ("SFX_OUT_FEU_ARTIFICE", 6),
    ("SFX_OUT_APPLAUSE", 8),
]

# ---------------------------------------------------------------- transitions
TRANSITIONS = {
    "enfance": [
        {"style": "crossfade_aquarelle", "asset": "TR_ENF_AQUARELLE", "duration": 1.2,
         "sfx": "SFX_ENF_WHOOSH_DOUX", "gain_db": -16},
        {"style": "bulles_de_savon", "asset": "TR_ENF_BULLES", "duration": 1.0,
         "sfx": "SFX_ENF_BULLE_POP", "gain_db": -14},
        {"style": "fondu_enchaine_doux", "asset": None, "duration": 1.5,
         "sfx": "SFX_ENF_CARILLON", "gain_db": -18},
        {"style": "page_tournee_pastel", "asset": None, "duration": 1.0,
         "sfx": "SFX_ENF_PAGE", "gain_db": -16},
        {"style": "etoiles_scintillantes", "asset": "TR_ENF_ETOILES", "duration": 1.0,
         "sfx": "SFX_ENF_SCINTILLE", "gain_db": -16},
    ],
    "ado": [
        {"style": "glitch_rgb", "asset": "TR_ADO_GLITCH", "duration": 0.4,
         "sfx": "SFX_ADO_GLITCH", "gain_db": -10},
        {"style": "flash_stroboscopique_leger", "asset": None, "duration": 0.3,
         "sfx": "SFX_ADO_FLASH", "gain_db": -12},
        {"style": "whip_pan_neon", "asset": "TR_ADO_WHIP", "duration": 0.5,
         "sfx": "SFX_ADO_ACCEL", "gain_db": -12},
        {"style": "demi_teinte_pop_art", "asset": "TR_ADO_DEMITEINTE", "duration": 0.6,
         "sfx": "SFX_ADO_BASS_HIT", "gain_db": -10},
        {"style": "datamosh_vhs", "asset": "TR_ADO_VHS", "duration": 0.5,
         "sfx": "SFX_ADO_REWIND", "gain_db": -12},
        {"style": "tag_graffiti_wipe", "asset": "TR_ADO_SPRAY", "duration": 0.6,
         "sfx": "SFX_ADO_SPRAY", "gain_db": -12},
    ],
    "clown": [
        {"style": "explosion_bulle_bd", "asset": "TR_CLO_EXPLOSION_BD", "duration": 0.6,
         "sfx": "SFX_CLO_POP", "gain_db": -10},
        {"style": "iris_cercle_cartoon", "asset": None, "duration": 0.6,
         "sfx": "SFX_CLO_BOING", "gain_db": -10},
        {"style": "tarte_a_la_creme_splat", "asset": "TR_CLO_TARTE", "duration": 0.8,
         "sfx": "SFX_CLO_SPLAT", "gain_db": -10},
        {"style": "etoile_wipe", "asset": None, "duration": 0.6,
         "sfx": "SFX_CLO_SIFFLET_COULISSE", "gain_db": -12},
        {"style": "confettis_burst", "asset": "TR_CLO_CONFETTIS", "duration": 0.7,
         "sfx": "SFX_CLO_HONK", "gain_db": -10},
        {"style": "squash_stretch", "asset": None, "duration": 0.5,
         "sfx": "SFX_CLO_SIFFLET", "gain_db": -12},
    ],
}

ENTRY = {  # transition d'entrée de chaque partie (depuis la précédente)
    "enfance": {"style": "aquarelle_depuis_titre", "asset": "TR_ENF_AQUARELLE", "duration": 1.5,
                "sfx": "SFX_ENF_SCINTILLE", "gain_db": -14},
    "ado": {"style": "record_scratch_glitch", "asset": "TR_ADO_GLITCH", "duration": 0.4,
            "sfx": "SFX_ADO_RECORD_SCRATCH", "gain_db": -6, "sfx_lead": 1.0},
    "clown": {"style": "confettis_burst", "asset": "TR_CLO_CONFETTIS", "duration": 0.6,
              "sfx": "SFX_CLO_HONK", "gain_db": -8},
    "outro": {"style": "flash_dore", "asset": None, "duration": 0.5,
              "sfx": "SFX_OUT_WHOOSH_FLY", "gain_db": -10},
}

KEN_BURNS = [
    {"type": "ken_burns", "from_scale": 1.00, "to_scale": 1.12, "pan": "none", "ease": "ease_in_out_sine"},
    {"type": "ken_burns", "from_scale": 1.12, "to_scale": 1.00, "pan": "none", "ease": "ease_in_out_sine"},
    {"type": "ken_burns", "from_scale": 1.05, "to_scale": 1.15, "pan": "left_to_right", "ease": "ease_in_out_sine"},
    {"type": "ken_burns", "from_scale": 1.05, "to_scale": 1.15, "pan": "right_to_left", "ease": "ease_in_out_sine"},
]
ENF_BACKGROUNDS = ["BG_ENF_01_AQUARELLE", "BG_ENF_02_BULLES", "BG_ENF_03_NUAGES", "BG_ENF_04_BALLONS"]
ADO_BACKGROUNDS = ["BG_ADO_01_GRILLE_NEON", "BG_ADO_02_POPART", "BG_ADO_03_VILLE_NEON", "BG_ADO_04_GRAFFITI"]
CLO_BACKGROUNDS = ["BG_CLO_01_CHAPITEAU", "BG_CLO_02_BD_RAYONS", "BG_CLO_03_CONFETTIS"]
NEON_COLORS = ["#FF2BD6", "#00F0FF", "#B6FF00", "#FFE600"]
ADO_TEXTS = ["OMG", "MOOD", "LOL", "TROP BIEN", "CHILL", "RESPECT"]
CLO_TEXTS = ["BOING !", "OUPS !", "PAF !", "HONK !", "TADAAA !", "MDR", "AU SECOURS !", "LAURA SHOW !"]
CLO_STICKERS = [
    "STK_CLO_NEZ_ROUGE", "STK_CLO_YEUX_ROLLING", "STK_CLO_CHAPEAU_FETE", "STK_CLO_PERRUQUE_ARC",
    "STK_CLO_MOUSTACHE", "STK_CLO_ETOILES_VERTIGE", "STK_CLO_LARMES_RIRE", "STK_CLO_COEURS_YEUX",
]

STYLE = {
    "fonts": {
        "intro_outro_titre": "Bungee", "enfance": "Fredoka", "ado_neon": "Monoton",
        "ado_street_art": "Rubik Spray Paint", "clown_bd": "Bangers", "message_final": "Playfair Display",
    },
    "palettes": {
        "enfance": {"rose": "#FFC8DD", "bleu_ciel": "#BDE0FE", "jaune_doux": "#FFF1A8"},
        "ado": {"magenta": "#FF2BD6", "cyan": "#00F0FF", "violet": "#7A00FF", "lime": "#B6FF00", "nuit": "#0B0014"},
        "clown": {"jaune": "#FFD400", "rouge": "#E5202E", "vert": "#1DB954", "contour": "#111111"},
        "outro": {"or": "#FFD27A", "ambre": "#B8741A", "nuit": "#120C00"},
    },
    "grades": {
        "pastel_soft": "Noirs relevés, saturation -10 %, teinte chaude légère, léger bloom",
        "neon_cyberpunk": "Contraste +25 %, split-tone ombres violet / hautes lumières cyan, grain fin",
        "cartoon_pop": "Saturation +30 %, contraste +15 %, contours renforcés",
    },
}


# ---------------------------------------------------------------- helpers
def to_frames(seconds: float) -> int:
    return round(seconds * FPS)


def to_seconds(frames: int) -> float:
    return round(frames / FPS, 3)


def timecode(frames: int) -> str:
    total_s, ff = divmod(frames, FPS)
    minutes, secs = divmod(total_s, 60)
    return f"{minutes:02d}:{secs:02d}:{ff:02d}"


def time_fields(start_f: int, end_f: int) -> dict:
    return {
        "start": to_seconds(start_f), "end": to_seconds(end_f),
        "duration": to_seconds(end_f - start_f),
        "start_tc": timecode(start_f), "end_tc": timecode(end_f),
    }


def cycle(items: list, index: int):
    return items[index % len(items)]


def slot(start_f: int, end_f: int, count: int, index: int, width: int = 1) -> tuple[int, int]:
    """Bornes (en images) du créneau `index`, réparties sans trou ni chevauchement."""
    total = end_f - start_f
    return (start_f + round(index * total / count), start_f + round((index + width) * total / count))


def load_media(key: str) -> list[dict]:
    folder = ROOT / FOLDERS[key]
    files = sorted(p.name for p in folder.iterdir() if p.suffix.lower() in MEDIA_EXTS) if folder.is_dir() else []
    placeholder = not files
    if placeholder:
        print(f"ATTENTION : aucun média dans {FOLDERS[key]} -> noms fictifs PHOTO_xxx.jpg", file=sys.stderr)
        files = [f"PHOTO_{i:03d}.jpg" for i in range(1, PLACEHOLDER_COUNT + 1)]
    elif len(files) > MAX_PER_SECTION:
        print(f"ATTENTION : {len(files)} médias dans {FOLDERS[key]} -> sous-échantillonnage à {MAX_PER_SECTION}",
              file=sys.stderr)
        files = [files[i * len(files) // MAX_PER_SECTION] for i in range(MAX_PER_SECTION)]
    return [
        {"folder": FOLDERS[key], "file": name, "placeholder": placeholder,
         "is_video": Path(name).suffix.lower() in VIDEO_EXTS}
        for name in files
    ]


def make_transition(spec: dict, start_f: int) -> tuple[dict, list[dict]]:
    transition = {"style": spec["style"], "asset": spec["asset"], "duration": spec["duration"]}
    lead_f = to_frames(spec.get("sfx_lead", spec["duration"] / 2))
    sfx = [{"asset": spec["sfx"], "at": to_seconds(max(0, start_f - lead_f)), "gain_db": spec["gain_db"]}]
    return transition, sfx


# ---------------------------------------------------------------- sections
def build_intro(media: dict[str, list[dict]]) -> list[dict]:
    """0:00-0:30 à 120 BPM : titre 4 s, teaser 42 flashs d'1 temps (0,5 s), titre verrouillé 5 s."""
    title_end, teaser_end, end = to_frames(4), to_frames(25), to_frames(30)
    beat = FPS // 2
    clips = [{
        "id": "INT_TITLE_01", **time_fields(0, title_end), "type": "title",
        "text": "LAURA : 18 ANS DE SOUVENIRS", "font": STYLE["fonts"]["intro_outro_titre"],
        "layers": [
            {"role": "background", "asset": "BG_INT_ENERGY", "blend": "normal"},
            {"role": "title", "asset": "TITLE_3D_REVEAL", "blend": "normal"},
            {"role": "overlay", "asset": "OVL_INT_LIGHT_STREAKS", "blend": "screen", "opacity": 0.7},
        ],
        "transition_in": {"style": "fade_from_black", "asset": None, "duration": 0.3},
        "sfx": [{"asset": "SFX_INT_WHOOSH", "at": 0.0, "gain_db": -8}],
    }]
    flash_count = (teaser_end - title_end) // beat
    order = ["enfance", "ado", "clown"]
    per_folder = flash_count // len(order)
    for j in range(flash_count):
        key = cycle(order, j)
        pool = media[key]
        item = pool[(j // len(order)) * len(pool) // per_folder]
        a = title_end + j * beat
        clips.append({
            "id": f"INT_TEASER_{j + 1:02d}", **time_fields(a, a + beat), "type": "teaser_flash",
            "source": item, "look": LOOKS[key],
            "layers": [{"role": "photo", "fit": "cover_blur_fill", "scale": 1.0}],
            "effects": [{"type": "punch_in", "from_scale": 1.0, "to_scale": 1.12, "on_beat": True}],
            "transition_in": {"style": "cut_on_beat", "asset": None, "duration": 0},
            "sfx": [],
        })
    clips.append({
        "id": "INT_TITLE_LOCK", **time_fields(teaser_end, end), "type": "title_lock",
        "text": "LAURA : 18 ANS DE SOUVENIRS", "font": STYLE["fonts"]["intro_outro_titre"],
        "layers": [
            {"role": "background", "asset": "BG_INT_ENERGY", "blend": "normal"},
            {"role": "title", "asset": "TITLE_3D_REVEAL", "blend": "normal", "hold_frame": "last"},
            {"role": "overlay", "asset": "OVL_INT_LIGHT_STREAKS", "blend": "screen", "opacity": 0.5},
        ],
        "effects": [{"type": "beat_pulse", "from_scale": 1.0, "to_scale": 1.04, "period_s": 0.5}],
        "transition_in": {"style": "cut_on_impact", "asset": None, "duration": 0},
        "sfx": [],
    })
    return clips


def build_enfance(media: list[dict]) -> list[dict]:
    a0, b0 = (to_frames(t) for t in SECTION_RANGES["enfance"])
    clips = []
    for i, item in enumerate(media):
        a, b = slot(a0, b0, len(media), i)
        transition, sfx = make_transition(ENTRY["enfance"] if i == 0 else cycle(TRANSITIONS["enfance"], i), a)
        layers = [
            {"role": "background", "asset": cycle(ENF_BACKGROUNDS, i // 3), "blend": "normal"},
            {"role": "photo", "fit": "contain", "scale": 0.86, "corner_radius_px": 28, "shadow": "soft"},
            {"role": "overlay", "asset": "OVL_ENF_BULLES", "blend": "screen", "opacity": 0.5},
        ]
        if i % 4 == 0:
            layers.append({"role": "overlay", "asset": "OVL_ENF_PARTICULES", "blend": "screen", "opacity": 0.6})
        clips.append({
            "id": f"ENF_{i + 1:03d}", **time_fields(a, b), "source": item, "look": LOOKS["enfance"],
            "layers": layers, "effects": [cycle(KEN_BURNS, i)],
            "transition_in": transition, "sfx": sfx,
        })
    return clips


def build_ado(media: list[dict]) -> list[dict]:
    a0, b0 = (to_frames(t) for t in SECTION_RANGES["ado"])
    clips, i, unit, n = [], 0, 0, len(media)
    while i < n:
        collage = unit % 5 == 4 and n - i >= 3
        width = 3 if collage else 1
        a, b = slot(a0, b0, n, i, width)
        transition, sfx = make_transition(ENTRY["ado"] if unit == 0 else cycle(TRANSITIONS["ado"], unit), a)
        clip = {"id": f"ADO_{unit + 1:03d}", **time_fields(a, b), "look": LOOKS["ado"]}
        layers = [
            {"role": "background", "asset": cycle(ADO_BACKGROUNDS, unit // 2), "blend": "normal"},
            {"role": "overlay", "asset": "OVL_ADO_NEON_FLARES", "blend": "screen", "opacity": 0.5},
        ]
        if collage:
            clip["type"] = "collage"
            clip["sources"] = media[i:i + 3]
            layers.insert(1, {"role": "photo_group", "count": 3, "scale": 0.5,
                              "rotations_deg": [-6, 3, -2], "stagger_s": 0.25})
            layers.append({"role": "element", "asset": "ELT_ADO_COLLAGE", "blend": "chroma_key"})
            effects = [{"type": "collage_anime", "entry": "slam_with_tape", "ease": "out_back"}]
        else:
            clip["source"] = media[i]
            layers.insert(1, {"role": "photo", "fit": "contain", "scale": 0.84})
            effects = [
                {"type": "neon_frame", "color": cycle(NEON_COLORS, unit), "glow_px": 24},
                {"type": "zoom_punch", "from_scale": 1.0, "to_scale": 1.06, "on_beat": True},
            ]
            if unit % 3 == 2:
                effects.append({"type": "stroboscope_leger", "flashes": 2, "window_s": 1.0,
                                "intensity": 0.25, "max_hz": 2})
            if unit % 6 == 3:
                effects.append({"type": "texte_street_art", "text": cycle(ADO_TEXTS, unit // 6),
                                "font": STYLE["fonts"]["ado_street_art"], "anim": "spray_in",
                                "in_offset_s": 0.4, "hold_s": 2.0})
        clips.append({**clip, "layers": layers, "effects": effects,
                      "transition_in": transition, "sfx": sfx})
        i += width
        unit += 1
    return clips


def build_clown(media: list[dict]) -> list[dict]:
    a0, b0 = (to_frames(t) for t in SECTION_RANGES["clown"])
    clips = []
    for i, item in enumerate(media):
        a, b = slot(a0, b0, len(media), i)
        transition, sfx = make_transition(ENTRY["clown"] if i == 0 else cycle(TRANSITIONS["clown"], i), a)
        duration = to_seconds(b - a)
        effects = [
            {"type": "cartoon_outline", "width_px": 8, "color": STYLE["palettes"]["clown"]["contour"],
             "rotation_deg": 2 if i % 2 == 0 else -2},
            {"type": "sticker_visage", "asset": cycle(CLO_STICKERS, i), "tracking": "face_auto",
             "in_offset_s": 0.5, "duration_s": round(max(1.0, duration - 1.0), 3)},
        ]
        if i % 2 == 1:
            bubble_at = to_seconds(a + to_frames(0.6))
            effects.append({
                "type": "bulle_bd_popup", "asset": cycle(["STK_CLO_BULLE_PAROLE", "STK_CLO_BULLE_CRI"], i // 2),
                "text": cycle(CLO_TEXTS, i // 2), "font": STYLE["fonts"]["clown_bd"],
                "in_offset_s": 0.6, "duration_s": 1.6,
            })
            sfx = [*sfx, {"asset": "SFX_CLO_POP", "at": bubble_at, "gain_db": -10}]
        if i % 3 == 2:
            effects.append({"type": "ralenti_comique", "if_video_speed": 0.4,
                            "if_photo": "punch_in_lent_puis_freeze_tremblant", "hold_s": 1.0})
        clips.append({
            "id": f"CLO_{i + 1:03d}", **time_fields(a, b), "source": item, "look": LOOKS["clown"],
            "layers": [
                {"role": "background", "asset": cycle(CLO_BACKGROUNDS, i), "blend": "normal"},
                {"role": "photo", "fit": "contain", "scale": 0.82},
            ],
            "effects": effects, "transition_in": transition, "sfx": sfx,
        })
    return clips


def build_outro(media: dict[str, list[dict]]) -> list[dict]:
    """9:30-10:00 : mosaïque 32x18 (cellules de 60 px) qui s'assemble en « 18 », puis message final."""
    s, assembly_end, hold_end, end = (to_frames(t) for t in (570, 586, 592, 600))
    transition, sfx = make_transition(ENTRY["outro"], s)
    pool = [{"folder": FOLDERS[key], "files": [m["file"] for m in media[key]]} for key in FOLDERS]
    return [
        {
            "id": "OUT_MOSAIC_ASSEMBLY", **time_fields(s, assembly_end), "type": "mosaic_assembly",
            "layers": [
                {"role": "background", "asset": "BG_OUT_OR_BOKEH", "blend": "normal"},
                {"role": "overlay", "asset": "OVL_OUT_PAILLETTES", "blend": "screen", "opacity": 0.7},
            ],
            "mosaic": {
                "mask_asset": "MASK_18", "grid": {"cols": 32, "rows": 18, "cell_px": 60},
                "fill": "cells_inside_mask", "pool": pool, "assignment": "balanced_round_robin_by_folder",
                "reuse_photos": True, "tile_look": "gold_tint_10pct",
                "assembly": {"type": "fly_in_staggered", "origin": "random_edges", "duration_s": 12,
                             "stagger_s": 0.04, "ease": "out_back"},
            },
            "transition_in": transition, "sfx": sfx,
        },
        {
            "id": "OUT_MOSAIC_HOLD", **time_fields(assembly_end, hold_end), "type": "mosaic_hold",
            "layers": [
                {"role": "background", "asset": "BG_OUT_OR_BOKEH", "blend": "normal"},
                {"role": "overlay", "asset": "OVL_OUT_PAILLETTES", "blend": "screen", "opacity": 0.8},
            ],
            "effects": [
                {"type": "camera_pull_back", "from_scale": 1.0, "to_scale": 0.88},
                {"type": "tile_shimmer", "color": STYLE["palettes"]["outro"]["or"], "period_s": 1.5},
            ],
            "transition_in": {"style": "continu", "asset": None, "duration": 0}, "sfx": [],
        },
        {
            "id": "OUT_FINAL_MESSAGE", **time_fields(hold_end, end), "type": "final_message",
            "text": "Joyeux 18ème Anniversaire Laura !", "font": STYLE["fonts"]["message_final"],
            "layers": [
                {"role": "background", "asset": "BG_OUT_OR_BOKEH", "blend": "normal"},
                {"role": "mosaic_dimmed", "ref": "OUT_MOSAIC_HOLD", "opacity": 0.35},
                {"role": "title", "asset": "TITLE_OUT_FINAL", "blend": "normal", "in_offset_s": 0.5},
                {"role": "overlay", "asset": "OVL_OUT_FEUX_ARTIFICE", "blend": "screen", "opacity": 0.8},
            ],
            "effects": [{"type": "fade_to_black", "start": 597.0, "duration_s": 3.0}],
            "transition_in": {"style": "continu", "asset": None, "duration": 0}, "sfx": [],
        },
    ]


# ---------------------------------------------------------------- audio global
def build_audio() -> dict:
    def music(asset, start, end, fade_in, fade_out, gain_db, bpm):
        return {"asset": asset, "start": start, "end": end, "fade_in_s": fade_in,
                "fade_out_s": fade_out, "gain_db": gain_db, "bpm": bpm}

    return {
        "loudness_target_lufs": -16, "sample_rate_hz": 48000,
        "ducking": {"target": "music", "trigger": "voice_over", "reduction_db": -12,
                    "attack_s": 0.2, "release_s": 0.6},
        "music": [
            music("MUS_INTRO", 0.0, 30.5, 0.0, 1.5, -6, 120),
            music("MUS_ENFANCE", 30.0, 209.6, 1.5, 0.1, -10, 100),   # coupe nette sous le record scratch
            music("MUS_ADO", 210.0, 389.6, 0.0, 0.05, -8, 128),      # coupe nette sous le 2e scratch
            music("MUS_CLOWN", 390.0, 570.0, 0.0, 0.5, -8, 120),
            music("MUS_OUTRO", 570.0, 600.0, 1.0, 3.0, -8, 72),
        ],
        "voice_over": [
            {"asset": vid, "start": start, "est_duration": dur, "section": section, "gain_db": -2}
            for vid, start, dur, section in VOICE
        ],
        "sfx_global": [
            {"asset": "SFX_INT_RISER", "at": 20.0, "gain_db": -10, "note": "montée vers le titre"},
            {"asset": "SFX_INT_IMPACT", "at": 25.0, "gain_db": -6, "note": "verrouillage du titre"},
            {"asset": "SFX_ENF_RIRE_BEBE", "at": 90.0, "gain_db": -16},
            {"asset": "SFX_ENF_RIRE_BEBE", "at": 150.0, "gain_db": -16},
            {"asset": "SFX_ADO_ACCEL", "at": 385.5, "gain_db": -8, "note": "accélération avant le gag de fin"},
            {"asset": "SFX_ADO_RECORD_SCRATCH", "at": 388.9, "gain_db": -6, "note": "stop net à 389.6"},
            {"asset": "SFX_CLO_RIMSHOT", "at": 401.5, "gain_db": -10},
            {"asset": "SFX_CLO_WAH_WAH", "at": 468.0, "gain_db": -10},
            {"asset": "SFX_CLO_RIMSHOT", "at": 498.5, "gain_db": -10},
            {"asset": "SFX_OUT_APPLAUSE", "at": 547.5, "gain_db": -12, "note": "après VO_CLO_04"},
            {"asset": "SFX_CLO_TADAA", "at": 567.0, "gain_db": -8},
            {"asset": "SFX_OUT_SCINTILLE", "at": 586.0, "gain_db": -12},
            {"asset": "SFX_OUT_FEU_ARTIFICE", "at": 592.0, "gain_db": -10},
            {"asset": "SFX_OUT_APPLAUSE", "at": 594.5, "gain_db": -14},
        ],
    }


def build_registry() -> dict:
    registry = {}
    for aid, folder, blend, dur, loop in VIDEO_ASSETS:
        registry[aid] = {"type": "video", "path": f"assets/video/{folder}/{aid}.mp4", "blend": blend,
                         "duration_s": dur, "loop": loop, "source": "higgsfield"}
    registry["MASK_18"] = {"type": "image", "path": "assets/masks/MASK_18.png", "blend": "mask",
                           "source": "local",
                           "note": "« 18 » blanc très gras sur fond noir, 1920x1080, à créer dans l'éditeur"}
    for aid, bpm, dur in MUSIC:
        registry[aid] = {"type": "music", "path": f"assets/audio/music/{aid}.wav", "bpm": bpm,
                         "duration_s": dur, "source": "higgsfield_text_to_audio"}
    for aid, _start, dur, _section in VOICE:
        registry[aid] = {"type": "voice_over", "path": f"assets/audio/vo/{aid}.wav",
                         "est_duration_s": dur, "source": "higgsfield_text_to_speech"}
    for aid, dur in SFX:
        registry[aid] = {"type": "sfx", "path": f"assets/audio/sfx/{aid}.wav", "duration_s": dur,
                         "source": "higgsfield_text_to_audio"}
    return registry


# ---------------------------------------------------------------- validation
def referenced_assets(node) -> set[str]:
    found: set[str] = set()
    if isinstance(node, dict):
        for key, value in node.items():
            if key in {"asset", "mask_asset"} and isinstance(value, str):
                found.add(value)
            else:
                found |= referenced_assets(value)
    elif isinstance(node, list):
        for item in node:
            found |= referenced_assets(item)
    return found


def check_contiguity(name: str, clips: list[dict]) -> None:
    start_s, end_s = SECTION_RANGES[name]
    cursor = float(start_s)
    for clip in clips:
        if abs(clip["start"] - cursor) > 1e-6:
            raise ValueError(f"{name}: trou/chevauchement avant {clip['id']} ({cursor} -> {clip['start']})")
        cursor = clip["end"]
    if abs(cursor - end_s) > 1e-6:
        raise ValueError(f"{name}: la section se termine à {cursor} s au lieu de {end_s} s")


SECTION_META = {
    "intro": {"label": "Intro — titre & teaser", "mood": "Ultra dynamique, typographie 3D motion design, teaser des 3 univers",
              "music": "MUS_INTRO", "folder": None},
    "enfance": {"label": "Partie 1 — La Naissance & l'Enfance", "mood": "Pastel rose / bleu ciel / jaune doux, aquarelle, bulles de savon, Ken Burns",
                "music": "MUS_ENFANCE", "folder": FOLDERS["enfance"]},
    "ado": {"label": "Partie 2 — L'Adolescence", "mood": "Déjanté, néons, cyberpunk / pop-art, glitch, collages, street-art",
            "music": "MUS_ADO", "folder": FOLDERS["ado"]},
    "clown": {"label": "Partie 3 — Laura le petit clown", "mood": "Cartoon jaune / rouge / vert vif, bulles BD, stickers, ralentis comiques",
              "music": "MUS_CLOWN", "folder": FOLDERS["clown"]},
    "outro": {"label": "Outro — mosaïque « 18 » & message final", "mood": "Doré et féerique",
              "music": "MUS_OUTRO", "folder": None},
}


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    media = {key: load_media(key) for key in FOLDERS}
    clips_by_section = {
        "intro": build_intro(media),
        "enfance": build_enfance(media["enfance"]),
        "ado": build_ado(media["ado"]),
        "clown": build_clown(media["clown"]),
        "outro": build_outro(media),
    }
    for name, clips in clips_by_section.items():
        check_contiguity(name, clips)

    sections = [
        {"id": name, **SECTION_META[name], "start": SECTION_RANGES[name][0], "end": SECTION_RANGES[name][1],
         "start_tc": timecode(to_frames(SECTION_RANGES[name][0])), "end_tc": timecode(to_frames(SECTION_RANGES[name][1])),
         "clip_count": len(clips_by_section[name]), "clips": clips_by_section[name]}
        for name in SECTION_RANGES
    ]
    audio = build_audio()
    registry = build_registry()
    used = referenced_assets(sections) | referenced_assets(audio)
    missing = sorted(used - registry.keys())
    if missing:
        raise ValueError(f"Assets référencés mais non déclarés : {missing}")

    timeline = {
        "project": {
            "title": "LAURA : 18 ANS DE SOUVENIRS", "width": WIDTH, "height": HEIGHT, "fps": FPS,
            "aspect_ratio": "16:9", "duration_s": 600, "duration_tc": timecode(600 * FPS),
            "timecode_format": "MM:SS:FF",
            "export": {"container": "mp4", "video": "H.264 High, 16 Mb/s", "audio": "AAC 320 kb/s 48 kHz"},
            "notes": [
                "Les transitions sont centrées sur la coupe : la moitié de leur durée déborde de chaque côté.",
                "Les assets 'luma_matte' révèlent le plan B ; 'screen' = fond noir à fusionner ; 'chroma_key' = fond vert #00FF00.",
                "Sécurité photosensibilité : pas plus de 3 flashs par seconde, pas de flash rouge saturé.",
                "Les clips à source 'placeholder': true doivent être remplacés en relançant generate_timeline.py "
                "après dépôt des vraies photos.",
            ],
        },
        "style": STYLE,
        "assets": registry,
        "sections": sections,
        "audio": audio,
        "validation": {
            "section_totals_s": {name: SECTION_RANGES[name][1] - SECTION_RANGES[name][0] for name in SECTION_RANGES},
            "photo_counts": {key: len(media[key]) for key in FOLDERS},
            "placeholders": {key: media[key][0]["placeholder"] for key in FOLDERS},
            "assets_declared": len(registry),
            "assets_referenced": len(used),
            "assets_unused": sorted(registry.keys() - used),
        },
    }
    OUTPUT.write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total_clips = sum(len(c) for c in clips_by_section.values())
    print(f"OK : {OUTPUT.name} écrit ({total_clips} clips, {len(registry)} assets déclarés).")


if __name__ == "__main__":
    main()
