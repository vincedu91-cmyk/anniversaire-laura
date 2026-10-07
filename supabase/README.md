# Supabase: livre d'or de Laura

Projet: `anniversaire-laura` (`videlmnjplqwgalwrjdi`, région eu-west-3).
Console SQL: https://supabase.com/dashboard/project/videlmnjplqwgalwrjdi/sql/new

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
