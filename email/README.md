# E-mail d'invitation

Template responsive, en tableaux HTML, avec la charte du site : titre monumental, bandeau des trois univers, polaroïds, bloc date en noir et jaune, bouton de réponse, QR code vers `les18ansdelaura.fr`.

## Fabriquer l'e-mail

```bash
npm run email                       # champs de fusion {{prenom}} et {{lien}}
npm run email -- --syntax=brevo     # {{ contact.FIRSTNAME }} et {{ contact.LIEN }}
npm run email -- --syntax=mailchimp # *|FNAME|* et *|LIEN|*
npm run email -- --assets=https://exemple.fr/mail   # où seront hébergées les images
```

Sorties dans `email/dist/` (non versionné, il contient les photos de Laura) :

| Fichier | Usage |
|---|---|
| `invitation.html` | À importer dans l'outil d'envoi. |
| `invitation.txt` | Version texte brut, à coller dans le champ « texte » de l'outil. |
| `preview.html` | Aperçu local (prénom et lien d'exemple). |
| `assets/` | `qr.png` et `polaroid-1..3.png`, à héberger (voir plus bas). |
| `visuel-invitation.png` | Planche ordinateur + mobile (générée à la main avec Edge, voir ci-dessous). |

## À renseigner avant l'envoi

Dans `src/data/event.json` : `date`, `time`, `place`, `replyBefore`, `organizerContact`. Tant qu'ils contiennent `[... À COMPLÉTER]`, c'est ce texte qui s'affiche. Relancer ensuite `npm run email`.

## Les photos

`npm run email` prend la première photo de chaque dossier (`photos/Naissance-Enfance`, `photos/Adolescence`, `photos/Laura-le-petit-clown`) après `npm run photos`, et la glisse dans un polaroïd incliné avec ombre. **Sans photo**, des visuels abstraits aux couleurs des univers les remplacent. Pour choisir d'autres photos, mettre celles que vous voulez en premier (ordre alphabétique des noms de fichier).

## Héberger les images

Les clients de messagerie n'affichent que des images en ligne (URL absolue), pas des fichiers joints. Deux options :
1. **Sur le site** : copier `email/dist/assets/*` dans `public/mail/`, déployer, et garder l'URL par défaut `https://les18ansdelaura.fr/mail/`. Attention : si le dépôt GitHub est public, les polaroïds (photos de Laura) le deviennent aussi ; `public/mail/polaroid-*` est ignoré par Git pour éviter cela, il faut alors les téléverser à la main.
2. **Dans l'outil d'envoi** (Brevo, Mailchimp...) : téléverser les 4 images dans sa médiathèque, puis `--assets=` avec l'URL qu'il donne.

## Liens personnels

Chaque invité a un lien unique `https://les18ansdelaura.fr/invitation?c=<jeton>`. Sur `/gestion-invitations`, le bouton « Exporter pour le publipostage » produit un CSV `prenom;nom;email;lien;reponse` à importer dans l'outil d'envoi : la colonne `lien` alimente le champ `{{lien}}`. L'export peut être filtré (par exemple « Sans réponse » pour une relance).

## Compatibilité

- Mise en page en tableaux, styles en ligne, largeur 600 px max, réduite sur mobile (`@media` pour les clients qui les gèrent : Gmail, Apple Mail, Outlook mobile).
- Outlook Windows : bouton rectangulaire en VML, polices de secours Arial.
- Mode sombre : couleurs adaptées pour Apple Mail et Outlook.com ; le QR code garde un fond blanc (indispensable à la lecture).
- Polices du site (Bricolage Grotesque, Caveat, Geist Mono) chargées là où c'est possible, sinon Arial Black / Arial / Courier.
- Textes alternatifs sur toutes les images ; le lien en clair sous le bouton sert si les images sont bloquées.

## À tester avant l'envoi réel

Envoyer un test à soi-même sur Gmail (web et appli), Outlook, Apple Mail et un téléphone. Pour une vérification large (Litmus, Email on Acid), exporter `invitation.html`.

## Régénérer le visuel

```bash
msedge --headless=new --user-data-dir=%TEMP%\edge-mail --window-size=1250,2050 --virtual-time-budget=10000 ^
  --screenshot=email\dist\visuel-invitation.png file:///.../email/dist/planche.html
```

(`planche.html` affiche `preview.html` en 660 px et 375 px côte à côte.)
