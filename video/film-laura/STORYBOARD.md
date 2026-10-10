# Storyboard — « Et puis il y a Laura, quoi… »

Format 1920×1080, 30 i/s, 6:00. Direction artistique : `../../DESIGN.md` (un accent dominant par univers,
Bricolage Grotesque + Geist Mono, accents Caveat / Anton / Bangers, pas de `#000`/`#fff` purs en fond).
Captures de contrôle : `snapshots/`.

## Frame 1 — Ouverture : la conversation
- status: built
- src: compositions/opening.html (HyperFrames) · 0:00 – 0:24
- motion: rules `coordinate-target-zoom` (zoom dans la bulle), `center-outward-expansion` (photos), `motion-blur-streak` (flou de poussée), `kinetic-beat-slam` (titre)
- beats:
  1. 0:00 noir chaud, halo doré ; le téléphone monte (expo.out), nappe de tension + battements de cœur.
  2. 0:01.3 la caméra cadre le bas du fil (×1,25 → ×1,36) ; 12 messages, rythme qui accélère (1,2 s → 0,5 s), son à chaque bulle.
  3. 0:11.2 « écrit… » ; 0:12.6 « Bon. On balance les archives ? » (bulle cerclée d'or).
  4. 0:14.2 vibration ×2, coupure nette de la nappe ; 0:15.4 silence.
  5. 0:15.6 zoom vers la bulle (×4,4 puis ×18, flou) ; whoosh 0:18.0, éclair crème, impact 0:18.45.
  6. 0:18.5 14 tirages jaillissent du centre (expo.out, décalage 35 ms) et couvrent l'écran.
  7. 0:20.3 « Et puis il y a » (mots en cascade), « Laura, » (or, flou → net), « quoi… » (points un par un).
  8. 0:23.3 fondu crème.

## Frame 2 — Univers 01 : Naissance & enfance
- status: built (emplacements « PHOTO À VENIR »)
- src: compositions/univers-enfance.html (HyperFrames) · 0:24 – 2:05
- motion: rules `scale-swap-transition`, `depth-of-field-blur`, Ken Burns (`creator-editing-recipes` › Pan / Ken Burns)
- beats: titre centré → étiquette de coin ; « Juillet 2009 » manuscrit ; 21 cartes (fondu aquarelle, bulles de savon, page tournée, étoiles) ; fonds vidéo aquarelle → bulles → nuages → ballons (fondu de 1 s toutes les 29 s).

## Frame 3 — Univers 02 : Adolescence
- status: built (emplacements « PHOTO À VENIR »)
- src: compositions/univers-ado.html (HyperFrames) · 2:05 – 3:50
- motion: rules `chromatic-glitch`, `motion-blur-streak` (whip pan), `kinetic-beat-slam` (pulsation au tempo), `waterfall-entry` (collages)
- beats: titre glitch ; 12 photos à cadre néon (couleur de timeline.json) pulsées à 99 BPM ; transitions whip pan / VHS / demi-teinte / tag / éclair unique ; 3 collages scotchés ; « OMG » ; accélération puis *record scratch* (inversion 0,2 s) et coupe au noir.

## Frame 4 — Univers 03 : Bêtises
- status: built (emplacements « PHOTO À VENIR »)
- src: compositions/univers-betises.html (HyperFrames) · 3:50 – 5:35
- motion: rules `spring-pop-entrance`, `physics-press-reaction` (squash & stretch, tampons), `particle-burst` (confettis)
- beats: « BÊTISES » en BD, tampon CONFIDENTIEL ; 21 tirages qui claquent sur le bureau, de plus en plus de travers (désordre croissant), tampons, bulles BD, ralentis figés tremblants ; « DOSSIER CLASSÉ » ; fondu vers le noir chaud.

## Frame 5 — Final : 18
- status: built
- src: video/remotion-finale (Remotion) → assets/video/finale/FINALE_REMOTION.mp4 · 5:35 – 6:00
- motion: `spring()` par tuile (152 tuiles, décalage 40 ms), reflet doré en balayage, recul ×0,88, message en ressort, feu d'artifice calé sur les explosions sonores, fondu au noir.

## Répartition HyperFrames / Remotion
- **HyperFrames** possède le film : montage, quatre séquences, tout l'audio (musiques, voix off, SFX, carve).
- **Remotion** possède une seule séquence, le final : une mosaïque de 152 tuiles pilotée par les données (React + `spring()`), rendue en MP4 muet.
- **Interface** : `build_film.py` écrit `video/remotion-finale/src/photos.generated.json` (photos réelles) ; Remotion rend `assets/video/finale/FINALE_REMOTION.mp4` ; `index.html` le place à 5:35 comme simple plan vidéo. Les repères visuels du final suivent les SFX mixés côté HyperFrames.
