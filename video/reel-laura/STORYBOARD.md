---
format: 1080x1920
duration: 49.9s
message: "Laura écrit sa propre histoire — et ce soir, c'est elle qui brille"
arc: Coulisses → Générique → Avant → Tourbillon → Bascule intime → Glow-up → Joie → Message
audience: Laura, sa famille et ses amis (projection + Reels / TikTok)
mode: collaborative
version: v1
---

# Reel « Je m'appelle Laura » — storyboard v1

## Décisions

- **Message** : Laura écrit sa propre histoire — et ce soir, c'est elle qui brille.
- **Public et arc** : les proches de Laura ; arc de la tendance glow-up — coulisses, « avant »,
  tourbillon de passions, bascule intime, transformation, joie, message d'anniversaire.
- **Format** : 1080×1920, 30 i/s, 49,9 s (durée de la bande-son). Pas de voix-off ajoutée :
  la réplique de la tendance porte l'histoire, les textes à l'écran la personnalisent. Musique :
  celle de la bande-son. Zone sûre texte : y 260–760 px (hors interface TikTok en bas et à droite).
- **Fil conducteur** : la ligne de texte manuscrite blanche en haut de l'écran, qui « écrit »
  l'histoire de Laura mot après mot ; elle se tait pendant les plans de pure émotion et revient en
  or pour la dernière phrase.
- **Design** : depuis `../../DESIGN.md`. Univers Adolescence pour le corps du Reel
  (nuit `#08040F`, accent unique magenta `#FF2BD6`, blanc cassé `#F6F3FF`), rouge `#E5202E` pour
  le générique, univers Finale pour la dernière carte (noir chaud `#070605`, or `#FFD27A`,
  crème `#F4EBDD`). Texte courant : Bricolage Grotesque 800, blanc cassé, contour 6 px `#08040F`
  + ombre portée ; mot-clé : Anton magenta contouré blanc ; compteur 1–5 : Geist Mono.
- **Interdits** : pas de logo Netflix (un « L » rouge en ruban à la place) ; pas d'émoji
  (cœur dessiné en SVG) ; pas de faux plan de Laura générée par IA ; pas de diaporama (chaque plan
  vit : micro-zoom 102→106 %) ; pas d'économiseur d'écran (aucun mouvement décoratif sans cue) ;
  pas de flash > 2/s.
- **Plan tenu** : Frame 8 — un seul plan de 4,8 s, rien ne coupe, la phrase s'écrit.
- **Vérité** : chaque plan montrant Laura est un vrai clip `R01`…`R27` ; les décors `D01`–`D03`
  ne montrent personne ; les prénoms des 5 proches restent `[À COMPLÉTER]` tant qu'ils ne sont pas donnés.

## Still open

- Les 5 « coups de cœur » de Laura (personnes, animal, plat…) et leurs prénoms.
- Phrase « Avant, j'étais totalement invisible » : gardée telle quelle (c'est la tendance) ou adoucie ?
- Faut-il 2 s de carte finale après la fin du son (projection) ou couper net à 49,9 s comme sur TikTok ?

## Frame 1 — Coulisses

- scene: Selfie miroir / maquillage / coiffure / pose — 4 vrais plans R01–R04
- duration: 3.9s
- poster: 1.2s
- transition_in: cut
- status: outline
- src: compositions/01-coulisses.html
- voiceover: onscreen « J'recommence… »
- slots: R01 0.00–1.00 · R02 1.00–2.05 · R03 2.05–2.95 · R04 2.95–3.90

Ouverture à froid sur les préparatifs : on surprend Laura avant qu'elle « entre en scène ».
« J'recommence… » s'écrit en haut dès 0,2 s. Cuts secs, micro-zoom continu sur chaque plan.
Contrainte : pas de titre, pas de logo avant le générique.

## Frame 2 — Générique « L »

- scene: Fond noir, un « L » rouge apparaît puis se déchire en rubans de couleur
- duration: 2.85s
- poster: 1.4s
- transition_in: cut
- status: outline
- src: compositions/02-generique.html
- voiceover: onscreen —
- slots: code (aucun clip)

Clin d'œil Netflix sans le logo : « L » Anton rouge `#E5202E` au centre, léger recul de caméra,
puis à 5,76 s (temps fort) il éclate en bandes verticales rouge/magenta/violet qui balaient l'écran
vers la droite et révèlent le plan suivant. Contrainte : pas de « N », pas de son ajouté.

## Frame 3 — Je m'appelle Laura

- scene: Plan d'action en selfie puis gros plan visage rieur ; « LAURA » claque sur le mot « Lara »
- duration: 2.05s
- poster: 1.2s
- transition_in: wipe-right
- status: outline
- src: compositions/03-nom.html
- voiceover: onscreen « Je m'appelle » (6,78 s) · « LAURA » (7,42 s)
- slots: R05 6.75–7.42 · R06 7.42–8.80

« LAURA » en Anton magenta contouré blanc, scale 1,25→1 en 0,18 s pile sur la syllabe « La- » :
le texte masque le prénom du film. Contrainte : le mot doit tomber à ±1 image du son.

## Frame 4 — Avant

- scene: Plan large où Laura est petite dans le cadre (sa passion), puis cocooning, passion au bureau, pouce levé
- duration: 6.8s
- poster: 2.0s
- transition_in: cut
- status: outline
- src: compositions/04-avant.html
- voiceover: onscreen « Avant, j'étais totalement » (8,86 s) · « INVISIBLE » (10,30 s)
- slots: R07 8.80–12.17 · R08 12.17–13.20 · R09 13.20–14.27 · R10 14.27–15.60

R07 tient 3,4 s pour que la phrase se lise ; « INVISIBLE » arrive avec un léger glitch
d'opacité (2 clignements max). Le texte sort à 12,1 s ; R08–R10 sont des plans muets de transition.
Contrainte : plan R07 large, Laura petite — c'est ce qui rend « invisible » drôle.

## Frame 5 — Coup de cœur intense

- scene: Un seul plan à sensations (manège, cabriolet, toboggan…) pendant que la phrase s'écrit
- duration: 4.35s
- poster: 2.8s
- transition_in: cut
- status: outline
- src: compositions/05-coup-de-coeur.html
- voiceover: onscreen « J'écris une lettre / chaque fois que j'ai / un coup de ♥ / si INTENSE » puis « que j'sais pas quoi faire d'autre »
- slots: R11 15.60–19.95

Accumulation : chaque fragment s'ajoute ligne par ligne sur son mot (15,66 / 16,78 / 17,34 /
18,06 s), le cœur SVG magenta bat une fois, « INTENSE » en Anton magenta. À 18,54 s le bloc est
remplacé par « que j'sais pas quoi faire d'autre ». Contrainte : un seul plan, pas de cut.

## Frame 6 — Pour 5 personnes

- scene: Laura écrit dans un carnet, puis 5 coups de cœur numérotés 1→5
- duration: 11.35s
- poster: 3.0s
- transition_in: cut
- status: outline
- src: compositions/06-cinq.html
- voiceover: onscreen « J'en ai écrit pour 5 personnes » (19,98 s) puis compteur « 1 · [À COMPLÉTER] » … « 5 · [À COMPLÉTER] »
- slots: R12 19.95–21.85 · R13 21.85–23.62 · R14 23.62–25.14 · R15 25.14–26.66 · R16 26.66–29.06 · R17 29.06–31.30

Chaque coup de cœur coupe sur un prénom du film (Peter 21,90 · Kenny 23,66 · Lucas 25,18 ·
John 26,70 · Josh 29,10). Compteur Geist Mono en haut au centre, chiffre magenta + prénom réel
en dessous. Le 5 est rappelé par le cœur de la Frame 5 (callback : un petit cœur à côté du chiffre).
Contrainte : vrais proches uniquement — prénom inconnu = `[À COMPLÉTER]`.

## Frame 7 — Fou rire

- scene: Deux plans intimes : fou rire au lit / sous la couette, visage sans maquillage
- duration: 2.55s
- poster: 1.6s
- transition_in: cut
- status: outline
- src: compositions/07-fou-rire.html
- voiceover: onscreen —
- slots: R18 31.30–32.58 · R19 32.58–33.85

Respiration dans la bande-son (aucune parole) : pas de texte, juste le rire. Cut sur le temps 32,58 s.

## Frame 8 — Il est temps

- scene: Plan tenu, lumière basse : Laura assise, calme, regard caméra ou de profil
- duration: 4.8s
- poster: 3.4s
- transition_in: crossfade
- status: outline
- src: compositions/08-il-est-temps.html
- voiceover: onscreen « Il est temps que tu montres à tout le monde / qui tu es vraiment… »
- slots: R20 33.85–38.65

Le plan tenu du Reel. Étalonnage assombri (-20 %), texte plus petit et posé, écrit mot à mot sur
la réplique. Fondu de 0,3 s depuis la Frame 7. Contrainte : aucun cut, aucun zoom au-delà de 103 %.

## Frame 9 — Glow-up

- scene: Flash blanc 3 images → Laura en tenue de soirée (révélation), puis arrivée tapis rouge
- duration: 3.95s
- poster: 1.0s
- transition_in: flash
- status: outline
- src: compositions/09-glow-up.html
- voiceover: onscreen « BIENVENUE À MA FÊTE » (41,90 s)
- slots: R21 38.65–40.67 · R22 40.67–42.60 (sinon D01 tapis rouge IA)

L'explosion : temps fort 38,69 s → flash (1 seul) et punch-in 110→100 %. « BIENVENUE À MA FÊTE »
en Anton crème sur le mot « bienvenue ». Contrainte : si pas de vrai plan tapis rouge, D01 est un
décor vide, Laura n'y est jamais ajoutée.

## Frame 10 — Tourbillon de joie

- scene: Montage rapide sur les temps : applaudissements des amis, fête, cri de joie, cadeaux
- duration: 4.05s
- poster: 1.0s
- transition_in: cut
- status: outline
- src: compositions/10-joie.html
- voiceover: onscreen —
- slots: R23 42.60–43.73 (sinon D02 foule IA) · R24 43.73–44.46 · R25 44.46–45.15 · R26 45.15–46.65

Cuts sur 43,73 / 44,46 / 45,15 s. Pas de texte : l'énergie suffit.

## Frame 11 — Ne cache pas cette partie de toi

- scene: Laura qui danse face caméra au soleil couchant (plage / paysage), puis carte finale or
- duration: 3.25s
- poster: 2.6s
- transition_in: cut
- status: outline
- src: compositions/11-final.html
- voiceover: onscreen « Ne cache pas cette partie de toi ♥ » (46,70 s) · « Joyeux anniversaire Laura ! » (48,22 s)
- slots: R27 46.65–49.90 (sinon D03 coucher de soleil IA)

Le fil revient en or : « Ne cache pas cette partie de toi » en blanc cassé, cœur crème ; à 48,22 s
la ligne cède la place à « Joyeux anniversaire » (Bricolage 800, crème) et « Laura ! » (Anton or
`#FFD27A`, 1,3× plus grand). La vidéo continue de bouger dessous jusqu'à la dernière image.
Contrainte : pas d'écran de fin figé.
