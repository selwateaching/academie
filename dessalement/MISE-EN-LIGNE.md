# Mettre la plateforme en ligne sur Render, de A à Z

Durée : environ 15 minutes. Il faut un compte GitHub et un compte Render (render.com).

## 1. Le code sur GitHub

Le code est dans le dépôt `selwateaching/academie`, branche `claude/dessalement-saas`, dossier `dessalement/`.
Si vous partez de l'archive .zip, créez un dépôt GitHub (de préférence **privé**) et déposez-y le contenu du dossier.

## 2. Créer la base de données

1. Sur Render : **New +** → **Postgres**.
2. Nom : `formation-dessalement-db`. Région : **Frankfurt**. Offre : **Basic 256 MB** (environ 6 $/mois).
   L'offre gratuite est effacée au bout de 30 jours : à éviter pour de vrais clients.
3. Une fois la base prête, ouvrez-la et copiez l'**Internal Database URL**.

## 3. Créer le site

1. **New +** → **Web Service** → choisissez le dépôt GitHub.
2. Réglages :
   - Branche : `claude/dessalement-saas` (ou `main` si dépôt à vous)
   - Root Directory : `dessalement`
   - Runtime : **Node**
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Région : **Frankfurt** (la même que la base)
   - Offre : **Starter** (environ 7 $/mois, toujours allumé) ou **Free** (s'endort après 15 minutes)
3. Dans **Environment**, ajoutez :

| Clé | Valeur |
|---|---|
| `DATABASE_URL` | l'Internal Database URL copiée à l'étape 2 |
| `ADMIN_EMAIL` | votre e-mail de connexion |
| `ADMIN_PASSWORD` | votre mot de passe administrateur (8 caractères minimum) |
| `ADMIN_NAME` | votre nom, tel qu'affiché dans le tableau de bord |
| `NODE_ENV` | `production` |

4. Dans **Settings** → **Health Check Path** : `/healthz`.
5. Cliquez sur **Create Web Service**. Le premier déploiement prend 2 à 3 minutes.

## 4. Première connexion

1. Ouvrez l'adresse donnée par Render (du type `https://formation-dessalement.onrender.com`).
2. Connectez-vous avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`.
3. Vous arrivez sur **Mes clients** → **+ Nouveau client**. La plateforme affiche les accès du responsable : copiez le message et envoyez-le-lui.
4. Le responsable se connecte, choisit son mot de passe, puis ajoute ses apprenants de la même façon.

Après la première connexion, vous pouvez retirer `ADMIN_PASSWORD` des variables : le compte reste créé.

## 5. Au quotidien

- **Mot de passe oublié** : le responsable (ou vous) clique sur l'apprenant → **Nouveau mot de passe**.
- **Fin de contrat d'un client** : **Désactiver le client**. Ses comptes ne peuvent plus se connecter, les résultats sont conservés.
- **Suivi** : bouton **Exporter (Excel)** dans la page du client.
- **Mise à jour** : chaque envoi sur la branche GitHub redéploie le site automatiquement.

## 6. Nom de domaine (facultatif)

Render → le service → **Settings** → **Custom Domains** → ajoutez par exemple `formation.votredomaine.com`, puis créez chez votre registraire l'enregistrement CNAME indiqué par Render.
