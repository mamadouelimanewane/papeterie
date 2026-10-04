# Sécurité de l'API + import du catalogue Moukat

## Pourquoi
Un audit de l'application (code, dépôt, site déployé) a relevé des failles qui permettaient notamment de se créditer un solde, de marquer une commande payée sans payer, de fixer soi-même le prix d'une commande, ou de modifier le statut de n'importe quelle commande. En parallèle, le stock réel du distributeur Moukat (775 références) doit remplacer le catalogue de démonstration.

## Sécurité

| Problème | Correction |
|---|---|
| Recharge du portefeuille créditée sans paiement | `/api/wallet/recharge` désactivée (403) ; JWT obligatoire |
| Webhook Versus accepté sans secret | `VERSUS_WEBHOOK_SECRET` obligatoire, comparaison en temps constant |
| Prix, promo et frais fixés par le client | Recalcul côté serveur (`src/lib/pricing.ts`) : produits et kits lus en base, promo validée et comptée dans la transaction, livraison fixe, quantité 1–100, stock décrémenté de façon conditionnelle |
| `PUT /api/orders/update` sans vérification | Session admin ou livreur assigné (JWT), statuts limités pour le livreur |
| `GET/PATCH /api/orders/[id]` sans contrôle de propriété | Propriétaire, livreur assigné ou admin ; le livreur ne voit pas l'OTP de livraison |
| Code marchand `schoolmatik` par défaut | `MERCHANT_CODE` obligatoire, comparaison en temps constant |
| Pas de limitation de débit | Connexions (10 / 15 min), inscriptions (5 / h), connexion admin (par IP et par email) |
| CORS `*` | Liste blanche `CORS_ORIGINS` (vide par défaut : même origine) |
| RBAC non appliqué à l'API | Permission par préfixe d'API (`*.view` en lecture, `*.manage` en écriture) ; en cas d'erreur de lecture des rôles, accès refusé |
| JWT mobiles de 30 jours | 7 jours |
| Keystore Android et `out.txt` versionnés | Retirés de l'index, `.gitignore` complété |

Fichiers principaux : `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/pricing.ts`, `src/lib/ratelimit.ts`, `src/lib/permissions.ts`.

## Catalogue
- `Product.barcode` (unique) : clé de réimport sans doublons.
- `scripts/import-moukat.ts` : nettoyage des noms et des fautes de frappe, 13 catégories, niveaux scolaires des livres, upsert par code-barres. Dry-run par défaut, `--apply` pour écrire, `--hide <fichier>` pour masquer des produits existants.
- `scripts/xlsx-to-json.mjs` : conversion du fichier Excel (sans dépendance). `data/` est ignoré par git (stock et prix du marchand).
- `scripts/add-barcode-column.ts` : ajout de la colonne sans le moteur de schéma Prisma.
- Photos réelles : déposer `public/products/<code-barres>.jpg` puis relancer l'import.
- Vitrine : tri par catégorie (produits illustrés d'abord), pagination « Afficher plus », pictogrammes des nouvelles catégories.

## État de la production
L'import (775 produits, 18 produits de démonstration masqués, 22 manuels illustrés conservés) a déjà été appliqué à la base de production. La vitrine actuellement en ligne affiche donc le nouveau catalogue avec l'ancien code ; cette PR apporte les protections et l'affichage.

## À faire AVANT de fusionner
- [ ] Définir sur Vercel `VERSUS_WEBHOOK_SECRET` et `MERCHANT_CODE` (`scripts/setup-vercel-secrets.ps1`). Sans eux, les paiements Versus et `/gestion` cessent de fonctionner (comportement voulu : échec fermé).
- [ ] Communiquer le secret à Versus (`https://papeterie.vercel.app/api/webhooks/versus`, en-tête `x-versus-signature` ou `Authorization: Bearer`).
- [ ] Ajouter `CORS_ORIGINS` seulement si un site d'un autre domaine appelle l'API depuis un navigateur.
- [ ] Vérifier qu'aucun rôle personnalisé de l'admin ne perd d'accès (le RBAC s'applique désormais aux routes API).
- [ ] Renouveler le mot de passe de la base Neon et vérifier que Vercel a repris la nouvelle valeur.

## Après le déploiement
```bash
WEBHOOK_SECRET=<secret> node scripts/verify-deploy.mjs
```
18 contrôles (vitrine, catalogue, protections). Le script n'écrit rien en base. Puis, à la main : une commande test en espèces depuis `/shop`, la connexion admin, l'app livreur (changement de statut avec OTP).

## Points d'attention
- La limitation de débit est en mémoire (par instance serverless) : elle freine la force brute sans garantie globale. Un stockage partagé (Redis/Upstash) est la suite logique.
- Les apps mobiles devront se reconnecter tous les 7 jours (pas de refresh token).
- L'app utilisateur appelle encore `/wallet/recharge` : elle recevra 403 tant qu'une recharge par paiement confirmé n'existe pas.
- Le keystore Android reste dans l'historique git : régénérer la clé de signature et purger l'historique est à planifier séparément.

## Tests effectués
`tsc --noEmit` ; import idempotent (775 produits, relancé sans doublon) sur un Postgres local ; commande avec total falsifié recalculée (1 200 F au lieu de 1 F), article sans identifiant refusé, code promo invalide refusé, recharge et webhook sans secret refusés ; vitrine vérifiée dans le navigateur (797 produits, tri, pagination, aucune erreur console).
