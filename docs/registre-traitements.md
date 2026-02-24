# Registre des traitements — nortoo

**Responsable du traitement :** nortoo SARL (en cours d'immatriculation)
**DPO :** support@nortoo.ma
**Date de création :** Mars 2026
**Dernière mise à jour :** Mars 2026

---

## Traitement 1 : Scoring anti-fraude COD

| Champ | Valeur |
|---|---|
| **Finalité** | Scoring automatique des commandes COD pour détecter les risques de fraude |
| **Base légale** | Consentement du marchand (OAuth) + intérêt légitime + exécution du contrat |
| **Catégories de personnes** | Clients finaux des marchands (acheteurs e-commerce) |
| **Catégories de données** | Nom, téléphone (haché), ville, adresse, montant, historique commandes |
| **Destinataires** | Le marchand propriétaire de la commande (via le dashboard) |
| **Transfert hors Maroc** | Oui — UE (Frankfurt, Allemagne) via Vercel et Neon |
| **Durée de conservation** | 24 mois (PII), puis anonymisation (stats agrégées conservées) |
| **Mesures de sécurité** | SHA-256 (téléphones), AES-256-GCM (tokens), HTTPS, auth signée, audit log, rate limiting |

## Traitement 2 : Gestion des comptes marchands

| Champ | Valeur |
|---|---|
| **Finalité** | Authentification et gestion des abonnements des marchands |
| **Base légale** | Exécution du contrat |
| **Catégories de personnes** | Marchands (propriétaires de boutiques YouCan) |
| **Catégories de données** | Nom de boutique, ID YouCan, token OAuth (chiffré) |
| **Destinataires** | nortoo uniquement |
| **Transfert hors Maroc** | Oui — UE (Frankfurt) |
| **Durée de conservation** | Durée de l'abonnement + 30 jours |
| **Mesures de sécurité** | AES-256-GCM (token), cookie signé HMAC |

## Traitement 3 : Audit et traçabilité

| Champ | Valeur |
|---|---|
| **Finalité** | Traçabilité des actions sensibles pour la sécurité et la conformité |
| **Base légale** | Obligation légale (Art. 23-24, Loi 09-08) + intérêt légitime |
| **Catégories de personnes** | Marchands utilisant le dashboard |
| **Catégories de données** | Action, horodatage, IP (anonymisée), user-agent |
| **Destinataires** | nortoo (interne), CNDP sur demande |
| **Transfert hors Maroc** | Oui — UE (Frankfurt) |
| **Durée de conservation** | 36 mois |
| **Mesures de sécurité** | Audit log immuable (pas de UPDATE/DELETE) |

## Traitement 4 : Monitoring applicatif

| Champ | Valeur |
|---|---|
| **Finalité** | Détection et résolution des erreurs techniques |
| **Base légale** | Intérêt légitime |
| **Catégories de personnes** | Tous les utilisateurs |
| **Catégories de données** | Erreurs techniques, stack traces (sans PII — IP supprimée avant envoi) |
| **Destinataires** | nortoo (via Sentry, hébergé UE) |
| **Transfert hors Maroc** | Oui — UE (Sentry EU) |
| **Durée de conservation** | 90 jours |
| **Mesures de sécurité** | PII stripping avant envoi, accès restreint |
