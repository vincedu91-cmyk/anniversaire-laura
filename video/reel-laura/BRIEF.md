---
workflow: general-video
flow: automation
storyboard: yes
message: "Laura écrit sa propre histoire — et ce soir, c'est elle qui brille"
destination: reel-vertical
aspect: 1080x1920
language: fr
audience: Laura, sa famille et ses amis (projection à la fête + partage TikTok / Reels)
length: 49.9s
---

## Intent

Reel d'anniversaire façon TikTok / Instagram Reels pour les 18 ans de Laura, sur la tendance
« La Vie de Chocoh » (référence : `C:\Users\g003215\Downloads\La Vie de Chocoh 🎬💖.mp4`).
Storytelling autobiographique / glow-up : coulisses → intro façon Netflix → « Je m'appelle Laura »
→ « Avant, j'étais totalement invisible… » → tourbillon de passions et de proches → passage intime
→ « Il est temps que tu montres à tout le monde qui tu es vraiment… » → transformation glamour
→ joie pure → « Ne cache pas cette partie de toi. Joyeux anniversaire Laura ! ».
Rythme : plans de 1,5 à 2 s, cuts calés sur la réplique et sur les temps forts de la bande-son.

## Assets

- `assets/audio/trend-lara-jean.mp3` — bande-son de la tendance (réplique doublée du film
  « À tous les garçons que j'ai aimés », 49,9 s), utilisée telle quelle. Mots horodatés :
  `assets/audio/trend-lara-jean.words.json`, temps forts : `beats/assets/audio/trend-lara-jean.mp3.json`.
- `../../photos/Reel/` — vrais clips de Laura, un fichier par emplacement (`R01_…` à `R27_…`),
  voir `PLAN_TOURNAGE.md`. Vide au 10 oct. 2026 : emplacements « CLIP À VENIR ».
- `../film-laura/assets/fonts/*.woff2` — polices du projet (Bricolage Grotesque, Anton, Caveat, Geist Mono).

## Customizations

- Son de la tendance conservé : le prénom et les textes personnalisés passent à l'écran (sous-titres TikTok).
- IA uniquement pour des plans de décor sans Laura (D01 tapis rouge, D02 foule qui applaudit,
  D03 coucher de soleil) ; prompts dans `PLAN_TOURNAGE.md`. L'intro façon Netflix est construite en code.

## Notes

- Rien n'est inventé sur Laura : chaque plan la montrant vient d'un vrai clip ; tout manque reste
  un emplacement visible « CLIP À VENIR » et tout prénom inconnu `[À COMPLÉTER]`.
- Pas de logo Netflix : un « L » rouge en ruban dans le même esprit.
- Choix confirmés le 10 oct. 2026 : son de la tendance, vrais clips + décors IA, storyboard d'abord, pipeline automatique.
