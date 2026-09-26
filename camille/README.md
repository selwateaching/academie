# Camille IA / Plume – programmation des posts

`planificateur.html` envoie chaque post (texte, image, réseaux, date) à un
webhook Make, qui le programme dans Buffer. Buffer publie ensuite sur
Facebook, Instagram et LinkedIn à la date choisie.

## Mise en place (une seule fois)

1. **Buffer** (gratuit, 3 canaux) : connectez la page Facebook, le compte
   Instagram professionnel et LinkedIn.
2. **Make** : nouveau scénario
   - *Webhooks › Custom webhook* → copiez l'adresse.
   - Filtre : `secret` = votre code secret.
   - *Router* avec 3 branches, filtre `facebook` = `oui` (idem instagram, linkedin).
   - Sur chaque branche : *Buffer › Create a Status Update*
     (profil = le canal, Text = `text`, Photo = `image_url`,
     Scheduled at = `scheduled_at`).
   - Activez le scénario.
3. Ouvrez `planificateur.html`, dépliez « Réglages de connexion », collez
   l'adresse du webhook et le code secret. Ils restent dans le navigateur.

## Lien depuis Plume

`planificateur.html?texte=...&image=...` ouvre la page avec le post déjà rempli.
