# Les 18 ans de Laura : documentation

Site d'anniversaire en trois univers (enfance, adolescence, « Et puis il y a Laura, quoi… »), avec un livre d'or, des invitations avec réponse en un clic, un mode « écran géant » pour la soirée et une galerie photo collaborative alimentée par QR code.

- **Site en ligne :** https://anniversaire-laura.vercel.app
- **Dépôt GitHub :** https://github.com/vincedu91-cmyk/anniversaire-laura (branche `main`)
- **Hébergement :** Vercel, projet `anniversaire-laura` (https://vercel.com/vincent-petit/anniversaire-laura). Chaque `git push` sur `main` redéploie automatiquement en production.
- **Base de données et stockage :** Supabase, projet `Anniversaire-18-ans-laura` (https://supabase.com/dashboard/project/wzgrupqpupqdyjvbumnf)
- **Domaine prévu :** `les18ansdelaura.fr` (pas encore relié à Vercel, voir « Points à régler »)

> Ce document ne contient aucun secret. La clé du QR code et le secret de modération ne doivent jamais y figurer.

---

## 1. Toutes les URLs

Dans les tableaux, `<clé>` désigne la clé de la soirée (12 caractères, visible dans `/gestion-photos`) et `<jeton>` le jeton personnel d'un invité.

### 1.1 Parcours public (indexé, présent dans la navigation)

| URL | Contenu |
|---|---|
| `/` | Parcours complet : intro, enfance, transition, adolescence, transition, Laura, transition, mosaïque finale, message d'anniversaire, livre d'or en papiers, teaser du film. |
| `/naissance-enfance` | Univers 01 seul : « Le monde avant qu'elle ne sache encore qu'elle allait devenir Laura ». |
| `/adolescence` | Univers 02 seul : rapide, coloré, chaotique, social, énergique. |
| `/et-puis-il-y-a-laura` | Univers 03 seul : « On pourrait raconter Laura de manière sérieuse. Mais ce serait oublier un détail important. » (identifiant interne `mischief`). |
| `/le-film` | Lecteur vidéo du film « LAURA : 18 ANS DE SOUVENIRS » (10 minutes, 18 ans, 1 histoire). |

Chaque page d'univers se termine par un lien vers l'univers suivant, puis vers le film.

### 1.2 Pages pour les invités (privées, jamais indexées)

| URL | Rôle |
|---|---|
| `/invitation?c=<jeton>` | Réponse d'un invité en un clic : « Je serai là », « Peut-être », « Je ne pourrai pas ». Modifiable à tout moment. Le lien est envoyé par e-mail. |
| `/livre-d-or` | « Un mot pour Laura » : message écrit (1200 caractères) ou vocal (60 secondes). À envoyer aux proches. |
| `/photos?k=<clé>` | Envoi de photos pendant la soirée. C'est l'adresse du QR code. |
| `/photos?k=<clé>&mode=souvenirs` | Collecte de vieilles photos avec Laura, avant la soirée. |
| `/galerie?k=<clé>` | Galerie de la soirée : mur de photos, filtres, défis, cœurs. À envoyer aux invités après la fête (album souvenir). |
| `/galerie/diaporama?k=<clé>` | Diaporama automatique des meilleures photos. |

### 1.3 Écran géant (le jour J, lancé à la main)

| URL | Rôle |
|---|---|
| `/projection` | Le parcours complet du site en film chronométré, avec ambiance sonore et messages du livre d'or. |
| `/projection/live?k=<clé>` | Mur live : les photos des invités apparaissent à l'écran quelques secondes après leur envoi. |

### 1.4 Administration (privée, aucun lien depuis le site, protégée par le secret de modération)

| URL | Rôle |
|---|---|
| `/moderation` | Relire, approuver ou refuser les messages du livre d'or. |
| `/gestion-invitations` | Liste des invités, réponses, ajout, import, liens personnels, export publipostage. |
| `/gestion-photos` | Tableau de bord de la galerie : liens avec la clé, fenêtre d'ouverture, masquer/rétablir/supprimer, export ZIP. |

### 1.5 Fichiers techniques

| URL | Contenu |
|---|---|
| `/robots.txt` | Interdit l'indexation de toutes les pages privées. |
| `/icon` | Icône du site (favicon). |
| `/opengraph-image`, `/twitter-image` | Images d'aperçu pour le partage sur les réseaux et messageries. |

Toutes les pages privées portent aussi une balise `noindex`. Il n'y a pas de sitemap.

---

## 2. Fonctionnalités

### 2.1 Le parcours en trois univers

- **Intro** (`HeroIntro`), puis trois univers avec chacun sa couleur, sa typographie et son ambiance sonore.
- **Univers 01, enfance :** bulles, compositions de photos, ton doux.
- **Univers 02, adolescence :** piste horizontale rapide, ton coloré et chaotique.
- **Univers 03, « Et puis il y a Laura, quoi… » :** intro sur fond de silence, puis un dossier de « pièces à conviction » sur Laura.
- **Transitions animées** entre les univers (enfance vers adolescence, adolescence vers Laura, Laura vers finale).
- **Finale :** mosaïque de photos, message d'anniversaire, livre d'or qui tombe en papiers, teaser du film.
- **Navigation :** chronologie des univers, indicateur de progression, raccourci vers le film, visionneuse de photos (flèches gauche/droite, `Échap`).
- **Accessibilité :** les animations respectent le réglage « réduire les animations » du système, sauf sur les écrans géants (où elles sont toujours actives).

Les photos viennent du dossier `photos/` (voir § 4).

### 2.2 Le film (`/le-film`)

Lecteur personnalisé. Raccourcis : `Espace` ou `K` (lecture/pause), `F` (plein écran), `M` (muet), `C` (sous-titres), flèches gauche/droite (avance/recul), flèches haut/bas (volume).
Fichiers attendus dans `public/film/` : `laura-18-ans.mp4`, `poster.jpg`, `sous-titres-fr.vtt`. Tant que la vidéo est absente, la page affiche « [FILM À AJOUTER] ».

### 2.3 Le livre d'or

- Les proches écrivent un message ou enregistrent un message vocal (jusqu'à 60 secondes) depuis `/livre-d-or`.
- Un champ piège anti-robots filtre les envois automatiques.
- Rien n'est visible tant qu'un message n'est pas **approuvé** dans `/moderation`.
- Les messages approuvés tombent en papiers à la fin du parcours (`/`) et passent dans `/projection`.
- Option « révélation » : on peut garder tous les messages invisibles jusqu'au jour J avec `reveal_at` (voir `supabase/README.md`). Le filtre est appliqué par la base de données.

### 2.4 Les invitations

- Chaque invité a un **lien personnel** (`/invitation?c=<jeton>`) à glisser dans l'e-mail.
- `/gestion-invitations` permet de : voir qui vient, qui ne vient pas et qui n'a pas répondu (filtres par réponse) ; ajouter, modifier, supprimer un invité ; importer une liste ; copier le lien d'un invité ; exporter en CSV pour le publipostage ; copier toutes les adresses e-mail ; actualiser la liste.
- Données conservées : prénom, nom, e-mail, dans un schéma que l'API publique ne peut pas lire. À purger après la soirée (vider `private.guests`).
- Le modèle d'e-mail est dans `email/` (voir § 4).

### 2.5 La galerie photo collaborative

**Côté invité (téléphone) — `/photos?k=<clé>`**
- Envoi de plusieurs photos à la fois, réduites à 2000 px côté téléphone, avec une miniature de 480 px.
- Deux onglets : « La soirée » et « Souvenirs avec Laura » (avec année).
- Prénom optionnel, légende optionnelle (« un mot sur la photo »), consentement court.
- **6 défis** à relever : Selfie avec Laura, La photo de groupe la plus folle, Le meilleur du dancefloor, Pièce à conviction, Santé !, Le détail que personne n'a vu.
- **File d'envoi qui survit aux coupures :** les photos sont gardées dans le téléphone (IndexedDB) et réessayées automatiquement (Wi-Fi capricieux, 4G, retour de l'application au premier plan). Une photo n'est jamais perdue.
- L'invité peut retirer ses propres photos depuis son téléphone.
- Limites : 120 photos par appareil, 1500 au total, JPEG uniquement, 2 Mo par fichier.

**Galerie — `/galerie?k=<clé>`**
- Mur de photos qui se met à jour tout seul (toutes les 8 secondes, en pause quand l'onglet est masqué).
- Filtres : La soirée, Les plus aimées, un filtre par défi, Souvenirs.
- Cœurs sur les photos (un cœur par appareil, réversible).
- Visionneuse plein écran (flèches, `Échap`).
- Pagination « Voir plus ».

**Diaporama — `/galerie/diaporama?k=<clé>`** : défilement automatique des meilleures photos (mise à jour toutes les 15 secondes).

**Mur live — `/projection/live?k=<clé>`**
- Les nouvelles photos arrivent à l'écran en moins de 5 secondes (mise à jour toutes les 4 secondes).
- Entre deux arrivées, des photos mises en avant tournent ; une file d'attente accélère quand beaucoup de photos arrivent.
- QR code affiché à l'écran pour que les invités puissent envoyer leur photo.
- Mode « live » ou « best ».
- Raccourcis : `F` (plein écran), `Espace` ou `P` (pause), flèche droite (photo suivante).

**Mosaïque vivante** : sur `/`, les photos de la soirée remplacent peu à peu des tuiles de la mosaïque finale.

**Côté organisateur — `/gestion-photos`**
- Statistiques « en ce moment ».
- Les liens prêts à l'emploi (avec la clé) : envoi, galerie, diaporama, mur live, souvenirs.
- Fenêtre d'ouverture des envois (début et fin). Par défaut, ouverts en permanence. Les souvenirs ne sont jamais limités.
- Modération : masquer, rétablir ou supprimer une photo.
- Export ZIP des photos approuvées (soirée et souvenirs) à 2000 px.

### 2.6 Mode écran géant (`/projection`)

Parcours chronométré d'environ 7 minutes, auxquelles s'ajoute le livre d'or (6 secondes plus 8 secondes par message, plafonné à 150 secondes) : intro, enfance, transition, adolescence, transition, Laura (intro puis dossier), transition, mosaïque, message, livre d'or (absent s'il n'y a aucun message approuvé), fin. L'image, l'ambiance sonore et les effets sont calés sur la même horloge. Les durées se règlent dans `src/data/projection.ts`.

Raccourcis : `Entrée` ou `Espace` (démarrer, puis pause), `K` (pause), flèche droite (chapitre suivant), flèche gauche (chapitre précédent ou début du chapitre), `F` (plein écran), `M` (son), `R` (recommencer).

---

## 3. Architecture technique

### 3.1 Pile

Next.js 16.3.8 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, `motion` (animations), `@phosphor-icons/react` (icônes), `@supabase/supabase-js`. Outils de build : `sharp`, `exifr` (photos), `qrcode`.

> Ce Next.js présente des changements par rapport aux versions habituelles. Avant de modifier du code, lire le guide correspondant dans `node_modules/next/dist/docs/` (voir `AGENTS.md`).

### 3.2 Organisation du code

| Dossier | Contenu |
|---|---|
| `src/app/` | Les routes (voir § 1), `layout.tsx`, `robots.ts`, icônes et images de partage. |
| `src/sections/` | Les scènes du parcours : `home`, `childhood`, `adolescence`, `laura`, `transitions`, `finale`. |
| `src/components/` | `gallery` (envoi, galerie, mur live, admin), `guestbook`, `rsvp`, `projection`, `media`, `navigation`, `motion`, `shared`, `typography`. |
| `src/data/` | Contenu et accès aux données : `event.json`, `party.ts`, `guestbook.ts`, `rsvp.ts`, `projection.ts`, `film.ts`, `timeline.ts`, `photos.ts`. |
| `src/lib/` | `supabase.ts`, `photo-resize.ts`, `upload-queue.ts`, `zip.ts`. |
| `supabase/` | Migrations SQL, `setup-complet.sql`, `README.md`. |
| `scripts/` | `sync-photos.mjs`, `build-email.mjs`, `build-party-qr.mjs`. |
| `email/` | Modèle d'e-mail d'invitation et sa documentation. |
| `qr/` | Visuels du QR code générés (affiche, cartes de table). |
| `video/`, `voix-off/`, `timeline.json`, `generate_*.py` | Production du film (HyperFrames, voix off, bruitages). Hors site. |
| `DESIGN.md` | Charte graphique du site (la section 16 décrit la galerie). |

### 3.3 Base de données Supabase

Tout est fermé à l'API publique par des règles RLS ; l'accès passe par des fonctions SQL qui exigent une clé ou le secret de modération (stocké en hash bcrypt).

| Domaine | Tables et fonctions | Migration |
|---|---|---|
| Livre d'or | `guestbook_messages`, bucket audio `guestbook-audio` (3 Mo, audio) | `20261007000000_guestbook_schema.sql` |
| Invitations | `private.guests`, fonctions de réponse et d'administration | `20261008000000_rsvp_schema.sql` |
| Galerie | `public.party_photos`, `private.party_settings`, `private.party_hearts`, bucket public `party-photos` (JPEG, 2 Mo), fonctions `party_status`, `party_reserve`, `party_publish`, `party_list`, `party_heart`, `party_remove`, `party_admin_*` | `20261009000000_party_photos.sql` |

`supabase/setup-complet.sql` regroupe les trois schémas en un seul fichier.

Protections principales : 8 échecs de secret en 10 minutes bloquent les essais ; un fichier n'est accepté que pour un identifiant réservé avec la clé, une seule fois ; les photos masquées ou retirées disparaissent du site mais restent dans le stockage (à supprimer depuis le tableau de bord Supabase si besoin).

### 3.4 Variables d'environnement

| Variable | Rôle | Où |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse du projet Supabase | Vercel (production, preview, development) et `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publiable (faite pour le navigateur, protégée par RLS) | Vercel et `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | Adresse publique (adresses canoniques, Open Graph). Optionnelle, **pas encore définie en ligne**. | À ajouter sur Vercel |
| `PARTY_KEY` | Clé du QR code. Sert uniquement au script `npm run qr`, jamais au site. | `.env.local` uniquement |

Ne jamais utiliser la clé secrète (`service_role`) dans le site.

### 3.5 Commandes

```powershell
npm run dev         # serveur local (lance d'abord la synchronisation des photos)
npm run build       # build de production
npm run lint        # ESLint
npm run typecheck   # vérification TypeScript
npm run photos      # dossier photos/ vers public/photos (webp 2200 px, EXIF)
npm run email       # e-mail d'invitation dans email/dist/
npm run qr          # affiches et cartes de table dans qr/dist/
```

---

## 4. Contenus à fournir

| Contenu | Où | État |
|---|---|---|
| Date, heure, lieu, date limite de réponse, contact | `src/data/event.json` | Encore à compléter (`[… À COMPLÉTER]`) |
| Photos des univers | `photos/Naissance-Enfance`, `photos/Adolescence`, `photos/Laura-le-petit-clown`, puis `npm run photos` | Dossiers vides. Attention : le dossier existant s'appelle `Laura-en-vrille` alors que le script attend `Laura-le-petit-clown`. |
| Film | `public/film/laura-18-ans.mp4`, `poster.jpg`, `sous-titres-fr.vtt` | Absent |
| Souvenirs des invités | Export ZIP depuis `/gestion-photos`, à copier dans `photos/` | Après collecte |

### E-mail d'invitation

`npm run email` produit dans `email/dist/` : `invitation.html` (à importer dans l'outil d'envoi), `invitation.txt` (version texte), `preview.html` (aperçu), `assets/` (`qr.png` et polaroïds à héberger). Variantes de champs de fusion : `--syntax=mustache` (par défaut, `{{prenom}}` et `{{lien}}`), `brevo`, `mailchimp`. Détails dans `email/README.md`.

### Affiches du QR code

`npm run qr` produit dans `qr/dist/` : affiche A4 pour la porte (versions nuit et clair, PDF et PNG), cartes de table imprimables (nuit et clair) et `qr.svg`. Le QR pointe vers `https://les18ansdelaura.fr/photos?k=<clé>`.

---

## 5. Avant la soirée : liste de contrôle

1. **La veille :** vérifier que le projet Supabase est `ACTIVE_HEALTHY` (le plan gratuit se met en pause après environ 7 jours sans activité) ; au besoin, bouton *Restore* dans le tableau de bord. Ouvrir `/photos` avec le QR code et envoyer une photo de test.
2. Se connecter à `/gestion-photos` avec le secret de modération pour confirmer que l'administration fonctionne.
3. Compléter `src/data/event.json`, puis relancer `npm run email` si l'e-mail n'est pas encore parti.
4. Décider de l'adresse du QR code (voir ci-dessous), puis relancer `npm run qr` si elle change, et imprimer.
5. Facultatif : fixer la fenêtre d'ouverture des envois dans `/gestion-photos`.
6. Le jour J : ouvrir `/projection` (parcours) ou `/projection/live?k=<clé>` (mur live) sur l'ordinateur relié au projecteur, puis `F` pour le plein écran. Ouvrir une première fois le mur live avec la clé : elle est ensuite retenue par ce navigateur.
7. Après la soirée : exporter les ZIP, envoyer le lien `/galerie?k=<clé>` aux invités, purger `private.guests`.

## 6. Points à régler

- **Domaine :** le QR code et le site visent `les18ansdelaura.fr`, qui n'est pas relié au projet Vercel. Soit ajouter ce domaine dans Vercel (Settings > Domains) puis définir `NEXT_PUBLIC_SITE_URL`, soit régénérer les visuels avec `npm run qr` pour viser `anniversaire-laura.vercel.app`.
- **Fichiers du film non commités :** `video/film-laura/*` et `generate_sfx.py` ne sont pas dans le dépôt, donc pas dans le déploiement.
- **Photos orphelines :** quelques fichiers de test restent dans le bucket `party-photos` (suppression possible uniquement depuis le tableau de bord Supabase).
- **Secret de modération :** à changer par l'organisateur (voir `supabase/set-moderation-secret.sql`), le secret ne doit pas être partagé.
