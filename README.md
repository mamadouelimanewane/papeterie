# Schoolmatik Librairie

Plateforme de vente de fournitures scolaires et de livres à Dakar : vitrine client avec kits par classe,
paiement en ligne (Wave, Orange Money via Versus), back-office d'administration avec rôles,
espace marchand, portail livreur et deux applications mobiles (client et livreur, dans `mobile/`).

## Stack

- Next.js 16 (App Router) · React 19 · Tailwind CSS 4
- Prisma 7 sur PostgreSQL (Neon) avec l'adaptateur `pg`
- NextAuth (sessions admin et marchand) · JWT Bearer pour les apps mobiles
- Déploiement Vercel (tâche planifiée déclarée dans `vercel.json`)

## Démarrer en local

```bash
npm install
npx prisma generate
npm run dev          # http://localhost:3000
```

Le fichier `.env` (non versionné) doit contenir au minimum `DATABASE_URL` et `NEXTAUTH_SECRET`.

## Espaces

| URL | Usage |
| --- | --- |
| `/shop` | Vitrine client, kits par classe (`/shop/kits`) |
| `/login`, `/dashboard` | Back-office d'administration |
| `/merchant/login` | Espace marchand (lien d'invitation) |
| `/gestion` | Gestion rapide du catalogue, protégée par `MERCHANT_CODE` |
| `/livreur` | Portail livreur |

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL`, `POSTGRES_PRISMA_URL`, `DATABASE_URL_UNPOOLED` | Connexion PostgreSQL (application / migrations) |
| `NEXTAUTH_SECRET` | Signature des sessions et des jetons mobiles |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Super-administrateur de secours (sans base) |
| `MERCHANT_CODE` | Code d'accès de `/gestion` (long et aléatoire) |
| `VERSUS_BASE_URL`, `VERSUS_LOGIN`, `VERSUS_PASSWORD` | Paiement en ligne Versus |
| `VERSUS_WEBHOOK_SECRET` | Secret attendu sur `/api/webhooks/versus` |
| `CRON_SECRET` | Secret de la tâche planifiée `/api/cron/expire-orders` (envoyé par Vercel Cron) |
| `ORDER_PAYMENT_TTL_MIN` | Délai de paiement d'une commande avant libération du stock (défaut 60 min) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_URL`, `KV_REST_API_TOKEN`) | Limiteur de débit partagé entre instances ; sans eux, repli en mémoire par instance |
| `SEED_SECRET` | Protège `/api/admin/seed` et `/api/admin/fix-images` |
| `CORS_ORIGINS` | Origines autorisées (séparées par des virgules) |
| `LOCATIONIQ_KEY`, `NEXT_PUBLIC_LOCATIONIQ_KEY` | Géocodage des adresses de livraison |
| `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Notifications push |
| `GOOGLE_API_KEY` | Lecture de code-barres / photo produit (`/api/ai/scan`) |
| `ACTIVE_STORE_ID` | Boutique active en mode mono-boutique (sinon la première active) |

## Règles métier importantes

- Les prix, remises et frais de livraison sont toujours recalculés côté serveur.
- Une commande ne se paie qu'en ligne. Le stock est réservé à la création ; si le paiement n'arrive pas
  dans le délai (`ORDER_PAYMENT_TTL_MIN`), la commande est annulée (`paymentStatus = "Expire"`) et le stock libéré.
  Un paiement reçu ensuite re-réserve le stock, ou passe la commande en `"A rembourser"` si un article manque.
- Seules les commandes payées sont proposées aux livreurs.

## Scripts utiles

- `scripts/verify-deploy.mjs` : vérifie un déploiement
- `scripts/e2e-local.mjs`, `scripts/load-test.mjs` : parcours de bout en bout et test de charge
- `scripts/backfill-store-credits.ts` : rattrapage des crédits boutique (simulation par défaut)
