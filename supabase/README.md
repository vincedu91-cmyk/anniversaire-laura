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
