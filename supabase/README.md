# Supabase: livre d'or de Laura

Projet: `Anniversaire-18-ans-laura` (`wzgrupqpupqdyjvbumnf`).
Console SQL: https://supabase.com/dashboard/project/wzgrupqpupqdyjvbumnf/sql/new

## Mise en place (une seule fois)

1. **Schéma.** Coller le contenu de `migrations/20261007000000_guestbook_schema.sql` dans l'éditeur SQL, puis `Run`.
2. **Secret de modération.** Coller `set-moderation-secret.sql` après avoir remplacé la phrase par la vôtre (20 caractères minimum), puis `Run`. Le secret n'est jamais stocké en clair (hash bcrypt).
3. **Variables du site.** Copier `.env.example` en `.env.local` (déjà fait en local). En ligne, renseigner les mêmes variables chez l'hébergeur.

## Utilisation

| Page | Rôle |
|---|---|
| `/livre-d-or` | Lien à envoyer aux proches: message écrit ou vocal (1 minute). |
| `/moderation` | Relire, approuver ou refuser. Secret demandé à chaque visite. |
| `/` (fin du parcours) | Les messages **approuvés** tombent en papiers après le message final. |
| `/projection` | Mode écran géant: les messages approuvés y passent aussi. |

## Révéler les messages le jour J

Par défaut un message approuvé est visible tout de suite. Pour qu'ils restent invisibles jusqu'au jour J (même pour quelqu'un qui connaît l'API), fixer une date:

```sql
update private.settings set reveal_at = '2099-01-01 18:00:00+02' where id; -- remplacer par la vraie date et heure
```

`reveal_at = null` désactive le verrou. Le filtre est appliqué par la base (politique RLS), pas par le site.

## Sécurité en bref

- Un visiteur anonyme peut seulement **déposer** un message `pending` et **lire** les messages approuvés et révélés.
- Les droits d'écriture sont limités par colonne: impossible de choisir son propre statut.
- La modération passe par deux fonctions SQL qui exigent le secret; 8 échecs en 10 minutes bloquent les essais.
- Les messages vocaux sont dans un bucket public à noms aléatoires (uuid), limité à 3 Mo et aux types audio. Un message refusé reste techniquement présent dans le bucket: le supprimer depuis le tableau de bord Supabase si besoin.
- Il n'y a pas de limitation d'envoi par visiteur: un champ piège anti-robots filtre le plus simple. En cas d'abus, la modération suffit (rien n'est affiché sans approbation).

## Invitations (réponses des invités)

Après le schéma du livre d'or, la migration `migrations/20261008000000_rsvp_schema.sql` ajoute les invitations. **Le plus simple : coller `setup-complet.sql`** (livre d'or + invitations en un seul fichier) dans l'éditeur SQL, puis exécuter `set-moderation-secret.sql`.

| Page | Rôle |
|---|---|
| `/gestion-invitations` | Page privée, sans lien depuis le site : liste des invités, réponses, ajout, import, liens personnels, export publipostage. Même secret que la modération. |
| `/invitation?c=<jeton>` | Page de réponse de l'invité (un clic : présent, peut-être, absent). Le jeton est propre à chaque invité. |

Données personnelles : seuls le prénom, le nom et l'e-mail sont conservés, dans un schéma que l'API publique ne peut pas lire. À purger après la soirée (vider la table `private.guests` depuis l'éditeur SQL).

## Galerie photo de la soirée

Migration `migrations/20261009000000_party_photos.sql` (à appliquer après le livre d'or; `setup-complet.sql` l'inclut). Elle crée la table `party_photos`, le bucket public `party-photos` (JPEG, 2 Mo maximum par fichier) et les fonctions `party_*`.

| Page | Rôle |
|---|---|
| `/photos?k=<clé>` | Envoi des photos (le QR code pointe ici). La clé est mémorisée sur le téléphone. |
| `/galerie?k=<clé>` | Galerie de la soirée, filtres, défis, cœurs. À envoyer aux invités après la fête (album souvenir). |
| `/galerie/diaporama?k=<clé>` | Diaporama automatique des meilleures photos. |
| `/projection/live?k=<clé>` | Mur live pour l'écran géant. Ouvrir une fois avec la clé: elle est ensuite retenue par ce navigateur. |
| `/photos?k=<clé>&mode=souvenirs` | Collecte de vieilles photos avec Laura avant la soirée. |
| `/gestion-photos` | Organisateur (secret de modération): liens avec la clé, fenêtre d'ouverture, masquer/rétablir/supprimer, export ZIP. |

La **clé** (12 caractères) est générée à l'installation. Elle s'affiche dans `/gestion-photos`; pour la lire en SQL: `select upload_key from private.party_settings;`. Pour fabriquer les affiches: la copier dans `.env.local` (`PARTY_KEY=...`) puis `npm run qr`.

### Fenêtre d'ouverture des envois

Par défaut les envois de la soirée sont ouverts en permanence. Pour les limiter (depuis `/gestion-photos`, ou en SQL):

```sql
update private.party_settings set open_from = '2027-07-10 18:00:00+02', open_until = '2027-07-11 12:00:00+02' where id;
```

Les souvenirs ne sont jamais limités. `null` = sans limite.

### Sécurité en bref

- La table est **fermée** à l'API publique (RLS, aucun droit): tout passe par des fonctions SQL qui exigent la clé.
- Un fichier ne peut être envoyé que pour un identifiant **réservé** (clé exigée), une seule fois, en JPEG, 2 Mo maximum. Impossible de remplir le stockage sans réservation.
- Limites: 120 photos par appareil, 1500 au total.
- Les photos sont publiées tout de suite; l'organisateur peut masquer. Un invité retire ses propres photos depuis son téléphone (identifiant d'appareil gardé dans le navigateur, jamais exposé).
- Les fichiers sont dans un bucket public à noms aléatoires (uuid): une photo masquée ou retirée disparaît du site mais reste dans le stockage (la supprimer depuis le tableau de bord Supabase si besoin).

### Attention: le plan gratuit met le projet en pause

Un projet Supabase gratuit est **mis en pause après environ 7 jours sans activité** (il a déjà été trouvé en pause). Une base en pause = livre d'or, invitations et galerie hors service. Réactiver le projet depuis le tableau de bord (bouton *Restore*) la veille de la soirée, vérifier `/photos` avec le QR, puis laisser le site tourner. Stockage gratuit: 1 Go (une quarantaine d'invités x 10 photos = environ 200 Mo).

