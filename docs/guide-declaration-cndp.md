# Guide : Déclaration CNDP pour nortoo

## Prérequis

- Société immatriculée au Maroc (SARL ou autre)
- Accès internet
- Registre des traitements (`docs/registre-traitements.md`) à portée de main

## Étape 1 — Créer un compte sur la plateforme CNDP

1. Aller sur https://www.cndp.ma
2. Cliquer sur « Notification en ligne » ou « e-Services »
3. S'inscrire avec les informations de la société :
   - Raison sociale : nortoo SARL
   - RC / ICE : [numéro d'immatriculation]
   - Adresse : [adresse du siège social]
   - Email : support@nortoo.ma
   - Téléphone : [numéro du responsable]

## Étape 2 — Remplir le formulaire de déclaration préalable

Type de formalité : **Déclaration préalable** (Art. 12-15)
(Pas une autorisation préalable — nortoo ne traite pas de données sensibles au sens de l'Art. 1-3)

### Informations à renseigner (Art. 15)

| Champ du formulaire | Réponse nortoo |
|---|---|
| **(a) Responsable du traitement** | nortoo SARL — [adresse siège] |
| **(b) Dénomination du traitement** | « Scoring anti-fraude des commandes COD » |
| **(b) Finalité(s)** | Scoring automatique des commandes e-commerce en contre-remboursement pour détecter les risques de fraude avant expédition |
| **(c) Catégories de personnes** | Clients finaux des marchands e-commerce (acheteurs COD) |
| **(c) Catégories de données** | Nom, téléphone (haché SHA-256), ville, adresse, montant de commande, historique des commandes (succès/échecs) |
| **(d) Destinataires** | Le marchand propriétaire de la commande (accès via dashboard authentifié) |
| **(e) Transfert international** | Oui — Union Européenne (Allemagne, région Frankfurt) — Hébergeurs : Vercel Inc. et Neon Inc. |
| **(f) Durée de conservation** | 24 mois pour les données personnelles identifiantes, puis anonymisation. Statistiques agrégées conservées sans limite. |
| **(g) Exercice des droits** | Via formulaire web : https://nortoo.ma/data-rights — Ou par email : support@nortoo.ma — Délai : 10 jours ouvrables |
| **(h) Mesures de sécurité** | HTTPS, hash SHA-256 (téléphones), chiffrement AES-256-GCM (tokens), authentification signée HMAC, rate limiting, audit log immuable, monitoring Sentry (sans PII) |
| **(i) Interconnexions** | Interconnexion avec la plateforme YouCan (réception des commandes via webhook). Pas de cession de données à des tiers. |

## Étape 3 — Soumettre et obtenir le récépissé

1. Vérifier toutes les informations
2. Soumettre le formulaire
3. La CNDP délivre un récépissé dans un délai de **24 heures** (Art. 19)
4. Le traitement peut être mis en œuvre **dès réception du récépissé**

## Étape 4 — Mettre à jour l'application

1. Copier le numéro de déclaration
2. Remplacer `[À compléter après déclaration]` dans :
   - `src/app/privacy/page.tsx` (section 10)
   - Le footer du dashboard (section 5 de ce prompt)
3. Commit + deploy

## Rappels importants

- **Toute modification** du traitement doit être notifiée à la CNDP (Art. 15 dernier alinéa)
- L'amende pour défaut de déclaration va de **10 000 à 100 000 MAD** (Art. 52)
- En cas de récidive, les sanctions sont **doublées** (Art. 65)
- La CNDP peut **retirer le récépissé** si le traitement porte atteinte à l'ordre public (Art. 51)
