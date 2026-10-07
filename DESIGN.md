# DESIGN.md - Laura, 18 ans

> "18 ANS. UNE HISTOIRE. TROIS VISAGES."
> Lecture : expérience web narrative et émotionnelle, pour Laura et ses proches, en langage éditorial / expérimental, avec trois mondes visuels sur un seul système.

```
DESIGN READ
DESIGN_VARIANCE: 10
MOTION_INTENSITY: 10
VISUAL_DENSITY: 2
```

Ces trois valeurs sont fixes. Le skill `design-taste-frontend` (Taste-Skill v2) sert de contrainte de direction artistique et d'implémentation.

## 1. Concept

Le parcours est une ligne de vie : `NAISSANCE > ENFANCE > ADOLESCENCE > FOLIE > 18 ANS`.
Émotions successives : tendresse, nostalgie, énergie, rire, émotion, célébration.

Règle d'or : la technologie est au service des photos, les photos au service de l'histoire, l'histoire au service de Laura.
Aucun contenu inventé. Toute information absente s'affiche `[À COMPLÉTER]` ou `[ANNÉE]`.

## 2. Mood par univers

| Univers | Mood | Mouvement | Texture |
|---|---|---|---|
| Intro | Presque vide, neutre, monumental | Typo qui grandit et se décompose | Aucune |
| 01 Naissance / enfance | Tendre, lumineux, tactile, onirique | Doux, lent, parallaxe, flottement | Grain léger, papier, bulles |
| 02 Adolescence | Rapide, social, chaotique contrôlé | Vitesse, velocity skew, RGB split, scroll horizontal | Photocopie, glitch, stickers |
| 03 Bêtises | Drôle, cartoon, scrapbook, dossier d'enquête | Impacts, pops élastiques, tampons | Papier, contours épais, ombres dures |
| Finale | Calme, noir, or | Respiration, assemblage lent | Aucune |

## 3. Palettes (tokens dans `src/styles/tokens.css`)

- **Neutre (intro)** : `#E7E8EB` fond, `#0D0D11` encre.
- **Enfance** (désaturée, jamais "template pastel") : rose poudré `#E7B9C4`, bleu ciel `#B6D2E8`, jaune beurre `#F0E1A0`, lavande `#DAD3EC`, blanc cassé `#F5F1F2`, encre prune `#3B3042`.
- **Adolescence** : nuit `#08040F`, magenta `#FF2BD6`, cyan `#00F0FF`, violet `#7B2BFF`, bleu électrique `#2D5BFF`, jaune fluo `#E4FF1A`, blanc `#F6F3FF`. Aplats durs, pas de dégradé violet "IA".
- **Bêtises** : jaune `#FFD400`, rouge `#E5202E`, vert `#17B857`, bleu primaire `#1F4FE0`, papier `#FFFDF2`, noir `#111111`.
- **Finale** : noir chaud `#070605`, or `#FFD27A`, crème `#F4EBDD`.

Verrou de cohérence : chaque univers possède UN accent dominant, utilisé partout dans cet univers.
Pas de `#000` ni `#fff` purs en fond ou en texte courant.

## 4. Typographie

| Rôle | Police | Usage |
|---|---|---|
| Principale (tous univers) | Bricolage Grotesque (variable) | Titres monumentaux, très grandes sans-serif contemporaines |
| Secondaire commune | Geist Mono | Numéros, métadonnées, navigation (même langage dans les 3 mondes) |
| Accent enfance | Caveat | Manuscrit discret, années, notes. Jamais "bébé" |
| Accent adolescence | Anton | Affiche / magazine / street |
| Accent bêtises | Bangers | BD, tampons, onomatopées |

Aucune serif. Pas d'Inter. Emphase = graisse / italique de la même famille.
Descender italique : `leading-[1.1]` minimum.
Corps de texte : 16 px minimum, `max-w-[34ch]` à `65ch`.

## 5. Espacement et grille

- Densité 2 : sections de `min-h-dvh` à `140dvh`, très peu d'éléments par écran.
- Grille 12 colonnes (desktop) avec placements explicites hors grille (marges négatives, `translate`, débordements d'écran).
- Mobile : tout se replie en une colonne, les décalages deviennent des offsets modérés (`px-4`).
- Forme : rayon 0 partout (aplats nets). Les seules formes organiques sont celles de la composition D (enfance) et les bursts BD.
- Échelle z-index documentée dans `tokens.css` (`--z-*`).

## 6. Motion

Centralisé dans `src/motion/` : `tokens.ts` (durées, easings, springs, viewport, stagger) et `presets.ts`.

Presets : `fadeUp`, `scaleReveal`, `photoFloat`, `imageParallax`, `textSplit`, `glitchIn`, `comicPop`, `mosaicAssemble`, `universeTransition`.

Principes :
1. Chaque animation a une intention narrative (hiérarchie, récit, retour, changement d'état).
2. Respiration obligatoire : après chaque scène spectaculaire, un temps calme (grand vide, texte seul).
3. Uniquement `transform`, `opacity`, `clip-path` (+ `filter` ponctuel sur éléments isolés). Jamais `width/height/top/left`.
4. Scroll-driven : `useScroll` + `useTransform` (aucun `window.scroll` listener, aucun état React pour une valeur continue).
5. Pas de GSAP : `position: sticky` + `useScroll` couvrent le pinning, sans pin-spacers.

## 7. Interactions

- Curseur personnalisé très discret : anneau fin en `mix-blend-mode: difference`, curseur natif conservé, désactivé sur tactile.
- Aimants (`MagneticWrap`) sur les boutons principaux.
- Photos : zoom au survol, parallaxe à la souris, clic = plein écran (visionneuse accessible, clavier).
- Adolescence : tilt 3D, RGB split, sticker surgissant, `velocity skew` des titres.
- Bêtises : cercle rouge, flèche, tampon, effet BD au survol.
- Navigation : chronologie verticale (desktop) / barre basse (mobile), indicateur actif animé (`layoutId`), barre de progression de scroll.
- Audio : jamais automatique. Bouton `SOUND ON / SOUND OFF`. L'ambiance change avec l'univers (synthèse Web Audio, remplaçable par de vrais fichiers).

## 8. Responsive

- Desktop : superpositions, parallaxe, éléments hors grille, souris.
- Mobile : scroll horizontal vertical-driven, tap, long press inutile, effets lourds réduits (pas de tilt, pas de curseur), mosaïque finale recomposée en 18 vertical.

## 9. Accessibilité

- HTML sémantique, `main`, `nav` labellisée, lien d'évitement.
- Navigation clavier complète, focus visible (`--focus` par univers), visionneuse en `role="dialog"` avec piège de focus et `Escape`.
- `prefers-reduced-motion: reduce` : transforms / clips / animations neutralisés par CSS (`[data-m]`), `MotionConfig reducedMotion="user"`, scènes sticky aplaties en flux normal, scroll horizontal natif.
- Contrastes AA vérifiés par univers. Alt text obligatoire pour chaque photo (par défaut descriptif générique, personnalisable dans `src/data/*.ts`).

## 10. Traitement des images

- Source de vérité : le dossier `photos/` (3 sous-dossiers). `npm run photos` génère `public/photos/<univers>/*.webp` (max 2200 px), un `blurDataURL` et l'année (EXIF `DateTimeOriginal`, sinon année dans le nom de fichier, sinon rien).
- Rendu : `next/image` (AVIF/WebP, `sizes`, lazy, `priority` uniquement sur les images critiques).
- Fallback : cadre `[PHOTO À AJOUTER]` dans la couleur de l'univers (aucune image inventée).
- Ratio réservé via `width/height` pour éviter le CLS.

## 11. Transitions entre univers (scènes)

- **Enfance > Adolescence** : pastel, désintégration, accélération des photos, déformation typo, `PUIS... ELLE A GRANDI.`, RGB split, glitch, néon. Coupe brutale sur `02 ADOLESCENCE`.
- **Adolescence > Bêtises** : néon, freeze frame, record scratch (visuel + son si activé), explosion cartoon.
- **Bêtises > Finale** : chaos qui retombe, silence, obscurité, or, `18`.

## 12. Architecture

Voir `src/` : `data/` (photos, univers, timeline, film), `motion/` (tokens, presets, hooks), `components/` (navigation, gallery, motion, typography, media, shared), `sections/` (home, childhood, adolescence, mischief, finale), `styles/` (tokens, universes, globals).

## 13. Ajouter ses photos

1. Déposer les images dans `photos/Naissance-Enfance`, `photos/Adolescence`, `photos/Laura-le-petit-clown`.
2. `npm run photos` (exécuté aussi avant `dev` et `build`).
3. Optionnel : enrichir une photo (année, légende, alt, mise en avant) via les `overrides` de `src/data/childhood.ts`, `adolescence.ts`, `mischief.ts`, clé = nom du fichier.
4. Film : déposer `public/film/laura-18-ans.mp4`, `public/film/poster.jpg`, `public/film/sous-titres-fr.vtt`.

## 14. Livre d'or, mosaïque cliquable, écran géant

- **Livre d'or** (`/livre-d-or`, `/moderation`): messages texte ou vocaux, relus avant affichage (`supabase/README.md`). Les messages approuvés tombent en papiers après le message final (`GuestbookStack`). Aucun papier si aucun message.
- **Mosaïque 18**: une fois formée (progression >= 0.84), chaque tuile ouvre sa photo dans la visionneuse; la mosaïque s'écarte puis se recompose (ressort) à la fermeture.
- **Projection** (`/projection`): parcours chronométré sans souris, plan dans `src/data/projection.ts`. Les scènes sont les mêmes que sur le site, pilotées par une horloge au lieu du scroll. L'ambiance sonore change en cours de chapitre, calée sur l'image (`audioSwitch`). Clavier: Entrée (lancer), Espace (pause), flèches (chapitre), F (plein écran), M (son), R (recommencer). `?t=75` démarre à 75 s.
