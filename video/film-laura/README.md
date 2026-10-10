# Film « Et puis il y a Laura, quoi… » — 18 ans

Film de 6:00 (1920×1080, 30 i/s) assemblé avec **HyperFrames** ; le final est une séquence **Remotion**.

| Livrable | Fichier |
|---|---|
| Script | `SCRIPT.md` (+ voix off validée : `../../voix-off/script_neutre.md`) |
| Storyboard | `STORYBOARD.md` (+ captures dans `snapshots/`) |
| Timeline audiovisuelle | `TIMELINE.md` (générée) · plan source : `../../timeline.json` |
| Compositions HyperFrames | `index.html` (généré), `compositions/*.html` |
| Composition Remotion | `../remotion-finale/src/` (`Finale.tsx`, `mosaic.ts`, `Root.tsx`) |
| Ressources | `assets/` (polices, sons, fonds vidéo, rendu Remotion) |
| Rapport de contrôle qualité | `RAPPORT_QC.md` |
| Film | `renders/laura-18-ans-film.mp4` |

## Architecture

```
timeline.json ──► scripts/build_film.py ──► index.html (scènes + 120 pistes audio + carve)
 (plan source)          │                   compositions/*.html (régions SLOTS / BURST)
                        │                   TIMELINE.md
                        └──► ../remotion-finale/src/photos.generated.json
                                   │
                    npx remotion render ──► assets/video/finale/FINALE_REMOTION.mp4 (muet)
```

- **HyperFrames** : ouverture conversation, trois univers, montage, tout l'audio.
- **Remotion** : le final « 18 » (mosaïque de tuiles en ressorts). Aucun son côté Remotion.
- Les deux moteurs ne se recouvrent pas : HyperFrames place simplement le MP4 de Remotion à 5:35.

## Ajouter les vraies photos (le film se met à jour tout seul)

1. Déposer les photos (JPG/PNG/WebP, ou vidéos MP4) dans `photos/Naissance-Enfance`,
   `photos/Adolescence`, `photos/Laura-le-petit-clown` (à la racine du dépôt). Le HEIC n'est pas lu
   par le navigateur : l'exporter en JPG.
2. Depuis la racine du dépôt :

```bash
python generate_timeline.py
```

```bash
python video/film-laura/scripts/build_film.py
```

3. Rendre le final Remotion (il reprend les photos) :

```bash
cd video/remotion-finale && npx remotion render Finale ../film-laura/assets/video/finale/FINALE_REMOTION.mp4 --muted --codec=h264 --crf=16
```

4. Contrôler puis rendre le film :

```bash
cd video/film-laura && npx hyperframes check
```

```bash
cd video/film-laura && npx hyperframes render -o renders/laura-18-ans-film.mp4 --quality delivery
```

## Autres commandes

- Prévisualiser / éditer dans Studio : `npx hyperframes preview --background` (dans `video/film-laura`).
- Ouverture seule : `python video/film-laura/scripts/build_film.py --until 24`, puis un rendu `--quality draft`.
- Studio Remotion : `cd video/remotion-finale && npm run dev`.
- Bruitages : `python generate_sfx.py` (synthèse déterministe ; chaque son peut être remplacé par un
  fichier de bibliothèque de même nom).
- Prénom de l'ami·e dans la conversation : variable `friendName` de `compositions/opening.html`
  (Studio, ou `--variables` au rendu).

## Règles

- Aucun souvenir n'est inventé : sans photo, l'emplacement affiche « PHOTO À VENIR » et son dossier.
- `index.html`, `TIMELINE.md` et les régions `SLOTS` / `BURST` sont générés : modifier le script.
- Photosensibilité : au plus un éclair par transition (bien sous 3 flashs/s), pas de rouge saturé clignotant.
