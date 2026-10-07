# Higgsfield — Prompts d'assets · « LAURA : 18 ANS DE SOUVENIRS »

Chaque titre `###` correspond à un identifiant d'asset de `timeline.json` (même nom de fichier, à placer dans le chemin indiqué par `assets.<ID>.path`).
Les prompts vidéo/audio sont en **anglais** (meilleure compréhension par les modèles) ; les textes parlés sont en **français**.

---

## 0. Réglages communs (à lire avant de générer)

| Paramètre | Valeur |
|---|---|
| Format | 16:9, 1080p (sinon 720p puis upscale) |
| Durée | 5 à 10 s par clip, boucle « seamless » si le modèle le propose, sinon trimmer/boucler dans l'éditeur |
| Cohérence | Garder la même *seed* par partie (Enfance / Ado / Clown) pour des fonds homogènes |
| Négatif (ajouter à tout prompt vidéo) | `people, faces, hands, text, letters, watermark, logo, subtitles, blurry, low quality` |

### Convention de fond (il n'y a pas de canal alpha natif)

| Fond demandé dans le prompt | Mode dans `timeline.json` | Usage |
|---|---|---|
| `pure black background` | `screen` | Superposition lumineuse (bulles, flares, paillettes…) |
| `pure black background … ends fully white` | `luma_matte` | Le blanc révèle le plan suivant (transitions) |
| `solid pure green background (#00FF00)` | `chroma_key` | Stickers et éléments opaques |
| aucun (plein cadre) | `normal` | Fonds animés |

### Règles de sécurité et de qualité

- **Photosensibilité** : jamais plus de 3 flashs/s, pas de flash rouge saturé. Le « stroboscope léger » de l'Adolescence est limité à 2 flashs/s dans la timeline.
- **Texte dans l'image** : les modèles vidéo écrivent mal (surtout les accents : « 18ème »). Les prompts de titres ci-dessous sont fournis, mais **le plan B recommandé est de composer le texte dans l'éditeur** (After Effects / Premiere / Resolve) avec les polices de `timeline.json > style.fonts`, et de n'utiliser l'IA que pour les fonds et effets.
- **Audio** : si votre offre Higgsfield n'expose pas la génération de musique/bruitages, les mêmes prompts fonctionnent dans n'importe quel outil text-to-audio.
- **Musique** : les modèles génèrent des morceaux courts. Produire des segments de 60–90 s **au même BPM** (indiqué par asset) et les enchaîner dans l'éditeur.
- **Ordre de production conseillé** : fonds → transitions → stickers → voix off → musiques → bruitages (les durées réelles des voix off peuvent décaler légèrement les `start` de `audio.voice_over`).

---

## 1. INTRO (0:00 – 0:30) — ultra dynamique, 3D motion design, 120 BPM

### BG_INT_ENERGY
`assets/video/intro/BG_INT_ENERGY.mp4` · 10 s · boucle · plein cadre
```text
Abstract high-energy motion graphics background, deep navy to electric blue gradient, rotating light rays and pulsing rings at 120 BPM, colorful confetti particles bursting in rhythm in pink, cyan and yellow, cinematic glow, seamless loop, no text, no people
```

### TITLE_3D_REVEAL
`assets/video/intro/TITLE_3D_REVEAL.mp4` · 5 s · plein cadre (plan B : composer dans l'éditeur)
```text
Cinematic 3D motion design title reveal, the exact text "LAURA : 18 ANS DE SOUVENIRS" in thick glossy extruded 3D letters with candy-color gradient from pink to cyan to yellow, letters slam in one by one with bounce and light sweep, slow camera dolly-in, confetti burst on the last letter, dark blue background, ends on a stable readable frame
```

### OVL_INT_LIGHT_STREAKS
`assets/video/intro/OVL_INT_LIGHT_STREAKS.mp4` · 8 s · fusion `screen`
```text
Fast anamorphic light streaks and lens flares sweeping across the frame left to right, warm white and cyan, on a pure black background, no text, no people
```

---

## 2. PARTIE 1 — NAISSANCE & ENFANCE (0:30 – 3:30) — pastel rose / bleu ciel / jaune doux

Suffixe de style commun (déjà inclus dans les prompts) : *soft pastel palette of baby pink, sky blue and butter yellow, watercolor paper texture, dreamy, gentle slow motion*.

### 2.1 Fonds animés pastel

#### BG_ENF_01_AQUARELLE
`assets/video/enfance/` · 10 s · boucle
```text
Soft watercolor paint washes in baby pink, sky blue and butter yellow slowly flowing and blending on textured cream paper, gentle morphing organic shapes, dreamy, calm, seamless loop, no text, no people
```

#### BG_ENF_02_BULLES
`assets/video/enfance/` · 10 s · boucle
```text
Iridescent soap bubbles floating slowly upward across a soft pastel pink to sky blue gradient, sunlight glints on the bubbles, shallow depth of field, calm and dreamy, seamless loop, no text, no people
```

#### BG_ENF_03_NUAGES
`assets/video/enfance/` · 10 s · boucle
```text
Paper-cut style fluffy clouds, crescent moons and tiny stars drifting slowly in layered parallax over a pastel sky blue and soft yellow background, handcrafted children's picture-book illustration, gentle, seamless loop, no text, no people
```

#### BG_ENF_04_BALLONS
`assets/video/enfance/` · 10 s · boucle
```text
Pastel balloons in pink, light blue and pale yellow with thin ribbons floating gently upward against a watercolor sky, soft bokeh, nursery illustration style, slow and peaceful, seamless loop, no text, no people
```

### 2.2 Surimpressions

#### OVL_ENF_BULLES
`assets/video/enfance/` · 10 s · boucle · fusion `screen`
```text
Iridescent soap bubbles floating and popping slowly, pastel reflections, on a pure black background, no text, no people
```

#### OVL_ENF_PARTICULES
`assets/video/enfance/` · 10 s · boucle · fusion `screen`
```text
Soft golden-pink glitter dust particles drifting slowly with gentle sparkle, on a pure black background, dreamy bokeh, no text, no people
```

### 2.3 Transitions douces

#### TR_ENF_AQUARELLE
`assets/video/enfance/` · 5 s (garder ~1,5 s utile) · `luma_matte`
```text
White watercolor ink blooming outward from the center of the frame with organic wet edges, on a pure black background, the white fully covers the entire frame at the end, no text, no people
```

#### TR_ENF_BULLES
`assets/video/enfance/` · 5 s · `luma_matte`
```text
Many white round soap bubbles of growing size rising and merging until they fill the whole frame, on a pure black background, the frame ends completely white, no text, no people
```

#### TR_ENF_ETOILES
`assets/video/enfance/` · 5 s · fusion `screen`
```text
Sparkling white four-point stars twinkling and swirling across the frame, magical dust trail, on a pure black background, soft and gentle, no text, no people
```

### 2.4 Musique Enfance

#### MUS_ENFANCE
`assets/audio/music/MUS_ENFANCE.wav` · **100 BPM**, 4/4 · 3 min (3 segments de 60 s)
```text
Gentle lullaby-like instrumental, soft felt piano and warm ukulele playing a sweet nostalgic melody, light glockenspiel and soft strings, very soft brushed percussion, tender and heartwarming, 100 BPM, 4/4, loopable sections, no vocals
```

### 2.5 Voix off Enfance

Voix : **chaleureuse, douce, bienveillante, rythme posé, légèrement souriante** (narratrice ou narrateur de conte). Remplacer `[MOIS] [ANNÉE]` par les vraies informations.

| ID | Début | Durée est. | Texte (français) |
|---|---|---|---|
| VO_ENF_01 | 0:33 | 10 s | « Tout a commencé un jour de [MOIS] [ANNÉE], quand une toute petite Laura est arrivée… et que le monde de toute une famille a changé pour toujours. » |
| VO_ENF_02 | 1:15 | 9 s | « Premiers sourires, premiers pas, premières bêtises… chaque jour apportait sa nouvelle découverte, et chaque découverte, son éclat de rire. » |
| VO_ENF_03 | 2:00 | 10 s | « Les genoux écorchés, les gâteaux d'anniversaire, les dessins collés sur le frigo… une enfance faite de câlins, de cabanes et de rêves à n'en plus finir. » |
| VO_ENF_04 | 2:45 | 8 s | « À l'école, au jardin, pendant les vacances… Laura grandissait, curieuse de tout, toujours prête à tout essayer. » |
| VO_ENF_05 | 3:19 | 7 s | « Et puis, doucement, sans prévenir, la petite fille a commencé à grandir… un peu trop vite. » |

### 2.6 Bruitages Enfance (text-to-audio)

| ID | Durée | Prompt |
|---|---|---|
| SFX_ENF_BULLE_POP | 1 s | `Single soft soap bubble pop, light and airy, clean, no reverb tail` |
| SFX_ENF_CARILLON | 2 s | `Gentle music-box chime, three ascending notes, warm and soft, short reverb` |
| SFX_ENF_WHOOSH_DOUX | 1,5 s | `Very soft airy whoosh, like a breeze through a curtain, gentle and smooth` |
| SFX_ENF_PAGE | 1 s | `Soft paper page turn of a children's picture book, quiet and clean` |
| SFX_ENF_SCINTILLE | 2 s | `Magical sparkle glissando, tiny bells and glitter shimmer, delicate fairy dust` |
| SFX_ENF_RIRE_BEBE | 3 s | `Cute baby giggle, short and joyful, close-up, clean, no background noise` |

---

## 3. PARTIE 2 — ADOLESCENCE (3:30 – 6:30) — néons, cyberpunk / pop-art, déjanté

Suffixe de style commun : *neon cyberpunk pop-art, saturated magenta, cyan and violet, high contrast, energetic, glitchy*.

### 3.1 Fonds animés néon

#### BG_ADO_01_GRILLE_NEON
`assets/video/ado/` · 10 s · boucle
```text
Infinite neon grid tunnel flying forward at high speed, glowing magenta and cyan wireframe lines on a dark violet background, synthwave, pulsing at 128 BPM, seamless loop, no text, no people
```

#### BG_ADO_02_POPART
`assets/video/ado/` · 10 s · boucle
```text
Pop-art explosion background, halftone dots in hot pink, cyan and yellow, comic action rays rotating fast, bold graphic design, slight glitch jitter, seamless loop, no readable text, no people
```

#### BG_ADO_03_VILLE_NEON
`assets/video/ado/` · 10 s · boucle
```text
Rainy cyberpunk city street at night seen from a camera gliding forward, abstract neon signs with no readable text, magenta and cyan reflections on wet asphalt, no people, seamless loop
```

#### BG_ADO_04_GRAFFITI
`assets/video/ado/` · 10 s · boucle
```text
Brick wall covered in colorful street-art graffiti, spray paint strokes appearing and dripping in real time, neon palette, abstract non-readable tags, energetic, seamless loop, no people
```

### 3.2 Animations glitch / néons

#### OVL_ADO_NEON_FLARES
`assets/video/ado/` · 10 s · boucle · fusion `screen`
```text
Neon light flares and bokeh streaks pulsing in magenta and cyan, on a pure black background, rhythmic at 128 BPM, no text, no people
```

#### TR_ADO_GLITCH
`assets/video/ado/` · 5 s (garder ~0,4 s utile) · `luma_matte`
```text
White digital glitch blocks and horizontal slices tearing across the frame with RGB split, on a pure black background, the frame ends fully white, no text, no people
```

#### TR_ADO_WHIP
`assets/video/ado/` · 5 s · fusion `screen`
```text
Extreme speed motion-blur neon light streaks whipping from left to right across the frame, magenta and cyan, on a pure black background, no text, no people
```

#### TR_ADO_DEMITEINTE
`assets/video/ado/` · 5 s · `luma_matte`
```text
White halftone dots growing from tiny to huge until they fully cover the frame, pop-art style, on a pure black background, the frame ends completely white, no text, no people
```

#### TR_ADO_VHS
`assets/video/ado/` · 5 s · fusion `screen`
```text
VHS tracking noise, tape tear and rolling distortion bands, static and chromatic aberration, on a pure black background, no text, no people
```

#### TR_ADO_SPRAY
`assets/video/ado/` · 5 s · `luma_matte`
```text
White spray-paint strokes sweeping and filling the frame from left to right with paint drips, on a pure black background, the frame ends completely white, no text, no people
```

#### ELT_ADO_COLLAGE
`assets/video/ado/` · 5 s · `chroma_key`
```text
Torn paper pieces, washi tape strips, halftone shapes and stars flying in and sticking together like a handmade collage, neon pink, cyan and yellow, on a solid pure green background (#00FF00), no text, no people
```

### 3.3 Musique Adolescence

#### MUS_ADO
`assets/audio/music/MUS_ADO.wav` · **128 BPM**, 4/4 · 3 min (3 segments de 60 s)
```text
Energetic pop-rock instrumental, driving distorted guitars, punchy live drums, synth bass, neon arcade feel, catchy riffs with builds and drops, youthful and rebellious, 128 BPM, 4/4, starts immediately on the downbeat, no vocals
```

### 3.4 Voix off Adolescence

Voix : **dynamique, animateur radio jeune, rapide, punchy, plein de sourire**.

| ID | Début | Durée est. | Texte (français) |
|---|---|---|---|
| VO_ADO_01 | 3:32 | 7 s | « Plus vite, plus fort, plus fou ! Bienvenue dans les années ados : musique à fond, looks audacieux et fous rires jusqu'à minuit ! » |
| VO_ADO_02 | 4:18 | 7 s | « Les selfies, les copines, les soirées, les playlists sans fin… et ce talent unique pour faire les choses à sa façon ! » |
| VO_ADO_03 | 5:05 | 7 s | « Des fous rires incontrôlables, des moments inoubliables, et parfois… quelques grands moments de solitude. Mais toujours avec style ! » |
| VO_ADO_04 | 5:55 | 8 s | « Entre deux examens, trois fous rires et mille projets, Laura s'est construite, a trouvé sa voie… et son caractère bien trempé ! » |

### 3.5 Bruitages Adolescence

| ID | Durée | Prompt |
|---|---|---|
| SFX_ADO_RECORD_SCRATCH | 1,5 s | `Classic vinyl record scratch stop, sudden DJ scratch with the music abruptly cutting off at 0.6 seconds, then a short silence` |
| SFX_ADO_GLITCH | 1 s | `Short digital glitch zap, stuttering data corruption, bit-crushed burst, sharp` |
| SFX_ADO_FLASH | 0,5 s | `Camera flash pop with a quick electric capacitor whine, very short` |
| SFX_ADO_ACCEL | 3 s | `Powerful sports car acceleration, engine revving up fast with turbo whistle and gear shifts, ends with a doppler whoosh` |
| SFX_ADO_BASS_HIT | 1,5 s | `Deep cinematic bass drop hit with sub boom and short reverb tail, punchy` |
| SFX_ADO_REWIND | 1,5 s | `Fast VHS tape rewind whoosh, high-pitched rewinding sweep, retro analog` |
| SFX_ADO_SPRAY | 1,5 s | `Spray paint can being shaken then spraying a long stroke on a wall, close-up` |

---

## 4. PARTIE 3 — LAURA LE PETIT CLOWN (6:30 – 9:30) — cartoon jaune / rouge / vert vif

Suffixe de style commun : *2D cartoon, cel-shaded, flat bold colors (yellow, red, vivid green), thick black outlines, bouncy squash and stretch*. Pour les stickers : toujours **fond vert uni #00FF00**, objet centré, pas d'ombre portée.

### 4.1 Fonds cartoon

#### BG_CLO_01_CHAPITEAU
`assets/video/clown/` · 10 s · boucle
```text
2D cartoon circus big top interior, red and yellow striped tent rotating slowly with sweeping spotlight beams, bouncy motion, flat vibrant colors, bold black outlines, seamless loop, no text, no people
```

#### BG_CLO_02_BD_RAYONS
`assets/video/clown/` · 10 s · boucle
```text
Comic-book yellow background with red halftone dots and radiating action lines rotating and pulsing, flat cartoon style, bold colors, seamless loop, no text, no people
```

#### BG_CLO_03_CONFETTIS
`assets/video/clown/` · 10 s · boucle
```text
Colorful confetti and paper streamers falling continuously, vivid green, red and yellow, 2D cartoon party atmosphere, flat colors, seamless loop, no text, no people
```

### 4.2 Stickers animés pour visages

Tous : `assets/video/clown/` · 3 s · `chroma_key` · à suivre sur le visage (face tracking).

#### STK_CLO_NEZ_ROUGE
```text
A big shiny red clown nose pops in with squash and stretch bounce and wiggles, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

#### STK_CLO_YEUX_ROLLING
```text
A pair of cartoon googly eyes with black pupils rolling around comically and blinking, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

#### STK_CLO_CHAPEAU_FETE
```text
A striped cone party hat with a fluffy pompom drops in, bounces and wobbles, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

#### STK_CLO_PERRUQUE_ARC
```text
A giant rainbow-colored clown wig bouncing on springs, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

#### STK_CLO_MOUSTACHE
```text
A big curly black handlebar moustache wiggling and twirling at the ends, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

#### STK_CLO_ETOILES_VERTIGE
Boucle.
```text
A ring of yellow stars and tiny tweeting birds circling in a seamless dizzy loop, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

#### STK_CLO_LARMES_RIRE
```text
Two streams of cartoon blue laughing tears squirting sideways with small sparkles, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

#### STK_CLO_COEURS_YEUX
Boucle.
```text
Two red hearts popping out and beating rhythmically with small sparkles, seamless loop, 2D cartoon, centered, on a solid pure green background (#00FF00), no shadow, no text
```

### 4.3 Bulles BD pop-up (texte ajouté dans l'éditeur, police Bangers)

Tous : `assets/video/clown/` · 2 s · `chroma_key`.

#### STK_CLO_BULLE_PAROLE
```text
An empty white comic speech bubble with thick black outline popping in with a bouncy overshoot and a small wobble, completely blank inside, 2D cartoon, centered, on a solid pure green background (#00FF00), no text
```

#### STK_CLO_BULLE_CRI
```text
An empty spiky yellow and red comic explosion burst bubble popping out with a shake, completely blank inside, 2D cartoon, centered, on a solid pure green background (#00FF00), no text
```

Textes ajoutés dans l'éditeur (cycle de la timeline) : `BOING !`, `OUPS !`, `PAF !`, `HONK !`, `TADAAA !`, `MDR`, `AU SECOURS !`, `LAURA SHOW !`.

### 4.4 Transitions cartoon

#### TR_CLO_EXPLOSION_BD
`assets/video/clown/` · 5 s · `luma_matte`
```text
A white comic-book explosion starburst with halftone dots expanding from the center until it fills the whole frame, on a pure black background, the frame ends completely white, no text, no people
```

#### TR_CLO_TARTE
`assets/video/clown/` · 5 s · `luma_matte`
```text
A cartoon cream pie flies toward the camera and splatters on the lens, white cream spreading and dripping until it covers the whole screen, on a pure black background, the frame ends completely white, 2D cartoon, no text, no people
```

#### TR_CLO_CONFETTIS
`assets/video/clown/` · 5 s · fusion `screen`
```text
A burst of colorful confetti and streamers exploding toward the camera, red, yellow and green, 2D cartoon style, on a pure black background, no text, no people
```

### 4.5 Ralentis comiques (effet de montage, pas de génération)

Pour les photos : punch-in lent + freeze tremblant (paramétré dans `ralenti_comique`). Si le dossier contient des **vidéos**, les passer à 40 % de vitesse (`if_video_speed: 0.4`).

### 4.6 Musique Clown

#### MUS_CLOWN
`assets/audio/music/MUS_CLOWN.wav` · **120 BPM**, 4/4 · 3 min (3 segments de 60 s)
```text
Comedic circus brass band, tuba oompah bass, bright trumpets, sliding trombones, snare rolls, clarinet and xylophone, playful and chaotic fanfare, 120 BPM, 4/4, starts with a bold brass hit, ends with a big comedic finish, no vocals
```

### 4.7 Voix off Clown

Voix : **voix de bande-annonce comique / Monsieur Loyal de cirque, emphatique, goguenarde, avec des pauses de comédie**.

| ID | Début | Durée est. | Texte (français) |
|---|---|---|---|
| VO_CLO_01 | 6:33 | 8 s | « Mais attention ! Derrière la jeune fille sérieuse se cache… la reine incontestée de la grimace : Laura, le petit clown ! » |
| VO_CLO_02 | 7:20 | 8 s | « Nez rouge, perruque arc-en-ciel, déguisements improbables… Laura ne rate jamais une occasion de transformer un salon en piste de cirque. » |
| VO_CLO_03 | 8:10 | 8 s | « Une grimace ici, une imitation là… et toute la famille se retrouve pliée en deux. Le public est conquis, les abdos aussi ! » |
| VO_CLO_04 | 9:00 | 7 s | « Mesdames et messieurs, un tonnerre d'applaudissements pour notre artiste maison : Laura, clown officiel de la famille ! » |

### 4.8 Bruitages Cartoon

| ID | Durée | Prompt |
|---|---|---|
| SFX_CLO_BOING | 1 s | `Cartoon spring boing, bouncy rubber spring sound, comedic, single bounce` |
| SFX_CLO_HONK | 1 s | `Loud clown bike horn honk, squeaky rubber bulb, single comedic honk` |
| SFX_CLO_SIFFLET | 1,5 s | `Sharp referee whistle blow, short and loud, clean` |
| SFX_CLO_SIFFLET_COULISSE | 1,5 s | `Cartoon slide whistle going up then down, comedic` |
| SFX_CLO_POP | 0,5 s | `Cartoon bubble pop, short bouncy "pop", comedic` |
| SFX_CLO_SPLAT | 1,5 s | `Cartoon cream pie splat in the face, wet squishy splat then a small drip` |
| SFX_CLO_RIMSHOT | 2 s | `Comedy rimshot, snare drum "ba-dum-tss" with a cymbal crash` |
| SFX_CLO_WAH_WAH | 3 s | `Sad trombone wah-wah-wah-waaah, comedic failure sting` |
| SFX_CLO_TADAA | 3 s | `Triumphant comedic "ta-da" brass fanfare sting with a cymbal crash and short applause` |

---

## 5. OUTRO (9:30 – 10:00) — doré et féerique

### BG_OUT_OR_BOKEH
`assets/video/outro/` · 10 s · boucle
```text
Magical golden bokeh and warm light particles floating slowly, deep amber to black gradient, fairy-tale atmosphere, cinematic, seamless loop, no text, no people
```

### OVL_OUT_PAILLETTES
`assets/video/outro/` · 10 s · boucle · fusion `screen`
```text
Golden glitter sparkles shimmering and drifting upward, on a pure black background, elegant and magical, no text, no people
```

### OVL_OUT_FEUX_ARTIFICE
`assets/video/outro/` · 10 s · fusion `screen`
```text
Golden and champagne fireworks bursting in a night sky, on a pure black background, no buildings, no text, no people
```

### TITLE_OUT_FINAL
`assets/video/outro/` · 8 s · plan B : composer dans l'éditeur (police Playfair Display, or `#FFD27A`)
```text
Elegant 3D gold text reveal of the exact words "Joyeux 18ème Anniversaire Laura !", polished gold letters with sparkles sweeping across, soft golden light rays, dark amber background, ends on a stable readable frame
```

### MASK_18 (non Higgsfield)
`assets/masks/MASK_18.png` · 1920×1080 · à créer dans l'éditeur : « 18 » blanc très gras (police type Bungee) centré sur fond noir. La grille de la mosaïque (32 × 18 cellules de 60 px) se remplit dans les cellules blanches.

### MUS_OUTRO
`assets/audio/music/MUS_OUTRO.wav` · **72 BPM** · 30 s
```text
Golden magical emotional orchestral piece, music box and harp glissando introduction, warm strings and soft choir swell building to a triumphant tender finale, long fading final chord, 72 BPM, instrumental, 30 seconds
```

### Voix off Outro

Voix : **émue, chaleureuse, plus lente, sourire dans la voix**.

| ID | Début | Durée est. | Texte (français) |
|---|---|---|---|
| VO_OUT_01 | 9:35 | 8 s | « Dix-huit ans. Dix-huit années de rires, de larmes, de bêtises et de tendresse. Et ce n'est que le début de ton histoire. » |
| VO_OUT_02 | 9:52 | 3 s | « Joyeux dix-huitième anniversaire, Laura ! » |

### Bruitages Outro

| ID | Durée | Prompt |
|---|---|---|
| SFX_OUT_WHOOSH_FLY | 2 s | `Magical airy whoosh with golden shimmer, many small objects flying in and assembling, light and sparkling` |
| SFX_OUT_SCINTILLE | 4 s | `Long magical shimmer rising with harp-like glitter tones, warm and emotional, fairy dust` |
| SFX_OUT_FEU_ARTIFICE | 6 s | `Fireworks launching and bursting in the distance, several soft crackles and booms, celebratory, wide stereo` |
| SFX_OUT_APPLAUSE | 8 s | `Warm family applause with cheers and a few whistles, small intimate crowd, joyful` |

---

## 6. Voix off, bruitages et musique Intro

Voix : **énergique, complice, façon bande-annonce**, enchaînée juste avant le verrouillage du titre.

| ID | Début | Durée est. | Texte (français) |
|---|---|---|---|
| VO_INT_01 | 0:25,5 | 4 s | « Laura. Dix-huit ans de souvenirs. Prête ? On y va ! » |

| ID | Durée | Prompt |
|---|---|---|
| SFX_INT_RISER | 5 s | `Cinematic tension riser building over 5 seconds, rising white noise and synth sweep with snare roll, ends abruptly` |
| SFX_INT_IMPACT | 2 s | `Huge cinematic impact hit with sub boom, short metallic shimmer and reverb tail, punchy` |
| SFX_INT_WHOOSH | 1 s | `Fast bright whoosh transition, short and punchy` |

### MUS_INTRO
`assets/audio/music/MUS_INTRO.wav` · **120 BPM**, 4/4 · 30 s
```text
Ultra dynamic cinematic pop-electro trailer track, punchy drums, claps and bright synth arpeggios, whoosh risers building from 20 seconds to a huge impact hit at 25 seconds, celebratory and energetic, 120 BPM, 4/4, clean ending at 30 seconds, instrumental
```

---

## 7. Checklist assets → timeline

- [ ] Déposer les photos dans `photos/Naissance-Enfance/`, `photos/Adolescence/`, `photos/Laura-le-petit-clown/`, puis relancer `python generate_timeline.py` (les noms fictifs `PHOTO_xxx.jpg` sont remplacés par les vrais fichiers).
- [ ] Générer chaque asset et l'enregistrer au chemin `assets.<ID>.path` de `timeline.json`.
- [ ] Remplacer les `start` de `audio.voice_over` par les durées réelles des voix off générées.
- [ ] Créer `assets/masks/MASK_18.png`.
- [ ] Vérifier le rendu des titres (accents de « 18ème ») ; basculer sur le plan B éditeur si besoin.
- [ ] Contrôle final : aucun flash > 3 par seconde ; loudness cible −16 LUFS.
