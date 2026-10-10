---
workflow: general-video
flow: automation
storyboard: no
message: "Dix-huit ans d'archives de Laura, balancées par ses amis — tendre, drôle, complice"
aspect: 1920x1080
language: fr
length: 360s
---

## Intent

Film projeté pour les 18 ans de Laura (née en juillet 2009). Ouverture : une conversation entre deux
amis qui décident de « balancer les archives », puis trois univers — naissance & enfance,
adolescence, bêtises — et un final « 18 ». On rit avec Laura, jamais d'elle.

## Assets

- `../../photos/Naissance-Enfance`, `../../photos/Adolescence`, `../../photos/Laura-le-petit-clown` — photos/vidéos personnelles (vides au 9 oct. 2026 : emplacements « PHOTO À VENIR »).
- `../../assets/audio/music/*.mp3` — Une chanson douce, La Boulette, Maladie (Cheveux blonds).
- `../../assets/audio/vo/VO_*.mp3` — voix off Hugo (ElevenLabs), script `../../voix-off/script_neutre.md`.
- `../../assets/audio/sfx/*.wav` — bruitages synthétisés par `../../generate_sfx.py`.
- `../../assets/video/enfance/BG_ENF_*.mp4` — fonds aquarelle (rendus HyperFrames de `../hyperframes/bg-enfance`).

## Customizations

- Final « 18 » réalisé avec Remotion (`../remotion-finale`), intégré en plan vidéo muet.
- Musiques creusées sous la voix off (`hyperframes-audio` › carve).

## Notes

- Aucun souvenir inventé ; toute absence de média = emplacement visible.
- Durée fixée à 6:00 : l'ouverture de 24 s remplace l'intro de 20 s, l'univers Enfance est resserré de 4 s.
