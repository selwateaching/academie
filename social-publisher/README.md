# Social Publisher — publication automatique Instagram + Facebook

Vous créez vos visuels dans **Canva**, vous les déposez dans un dossier avec un petit fichier texte,
et ils sont publiés **automatiquement** à la date voulue sur Instagram et Facebook.
Gratuit (GitHub Actions + API officielle de Meta), sans serveur.

## Le quotidien (2 minutes par post)

1. Dans Canva : créez un visuel **1080 × 1350 px** (format portrait 4:5). Pour un carrousel, une page par slide.
2. Téléchargez en **JPG** (⚠️ Instagram refuse le PNG via l'API).
3. Dans `social-publisher/posts/`, copiez le dossier `_exemple` et renommez-le : `2026-10-25-lancement`.
4. Mettez-y vos images (`1.jpg`, `2.jpg`…) et modifiez `post.yml` (date, texte, liste des images).
5. Passez `status: draft` à `status: ready` et enregistrez (commit) sur la branche `main`.

Toutes les 30 minutes, le robot regarde les posts `ready` dont la date est passée, les publie,
et enregistre le résultat dans `result.json` (aucun doublon possible).

## Installation (une seule fois, ~45 min)

### A. Les comptes
1. Créez une **Page Facebook** (si vous n'en avez pas) : facebook.com/pages/create
2. Passez Instagram en **compte professionnel** : Paramètres → Type de compte → Passer à un compte professionnel.
3. Liez les deux : Instagram → Modifier le profil → Page → choisissez votre Page.

### B. L'application Meta
1. Allez sur **developers.facebook.com** → *Mes apps* → *Créer une app* → type **Entreprise** (Business).
2. Dans l'app : *Ajouter un produit* → **Instagram** (API avec connexion Facebook) et **Facebook Login for Business**.
3. Laissez l'app en **mode Développement** : pour publier sur vos propres comptes, aucune validation Meta n'est nécessaire.
   Vous devez être administrateur de l'app et de la Page.

### C. Le jeton (token) qui n'expire pas
1. Ouvrez **developers.facebook.com/tools/explorer**, choisissez votre app.
2. *Générer un jeton d'accès utilisateur* avec les permissions :
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`.
3. Transformez-le en jeton **longue durée** : outil *Débogueur de jeton d'accès* → *Prolonger le jeton d'accès*.
4. Avec ce jeton longue durée, dans l'Explorateur, appelez `me/accounts` : la réponse contient votre Page avec son
   **`access_token`** (jeton de Page, qui **n'expire pas**) et son **`id`** (= `META_PAGE_ID`).
5. Appelez `{id_de_la_page}?fields=instagram_business_account` : l'`id` obtenu est votre `META_IG_USER_ID`.

### D. Les secrets GitHub
Dépôt GitHub → *Settings* → *Secrets and variables* → *Actions* → *New repository secret* :

| Nom | Valeur |
|---|---|
| `META_PAGE_TOKEN` | jeton de Page (étape C.4) |
| `META_PAGE_ID` | identifiant de la Page |
| `META_IG_USER_ID` | identifiant du compte Instagram |

⚠️ Ne mettez jamais ces valeurs dans un fichier du dépôt.

### E. Rendre les images accessibles
Meta télécharge les images depuis une **URL publique**. Le robot utilise les URL `raw.githubusercontent.com`
du dépôt, qui ne fonctionnent que si **le dépôt est public**. Si le dépôt est privé, utilisez un dépôt
dédié **public** pour les médias (voir « Un dépôt par client » ci-dessous).

### F. Test sans risque
Onglet **Actions** → *Publication Instagram & Facebook* → *Run workflow* (case « Simulation » cochée) :
le robot affiche ce qu'il publierait, sans rien publier. Puis faites un premier vrai test avec un post simple.

## Reproduire pour un client

Le plus propre : **un dépôt par client** (copie de ce dossier + `.github/workflows/social-publisher.yml`),
avec ses propres secrets. Le client est ajouté comme *testeur/administrateur* de l'app Meta, ou vous
créez l'app dans son Business Manager. Pour un compte client que vous ne possédez pas, Meta exige
la **validation de l'app (App Review)** et la vérification de l'entreprise avant de publier en son nom :
prévoyez plusieurs jours.

## Dépannage

| Message | Cause probable |
|---|---|
| `Instagram exige du JPEG` | Exportez en JPG depuis Canva |
| `Invalid OAuth access token` | Jeton mal copié ou permissions manquantes (étape C) |
| `Only photo or video can be accepted as media type` | Image non accessible : dépôt privé (étape E) |
| Le post ne part pas | `status` n'est pas `ready`, date future, ou fuseau horaire (Paris par défaut) |

## Limites
Environ 100 publications/24 h par compte Instagram via l'API. Les Stories et Reels ne sont pas gérés dans cette version.
