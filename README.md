# Schoolmatik / NDUGUMi — Papeterie

Plateforme de vente et de livraison de fournitures scolaires (Dakar) : vitrine client, back-office
d'administration, espace marchand, espace livreur, applications installables (PWA) et applications
Android (client et livreur).

## Pile technique

- **Web / API** : Next.js 16 (App Router, route handlers), React 19, Tailwind CSS 4
- **Données** : PostgreSQL (Neon) via Prisma 7 (`@prisma/adapter-pg`)
- **Authentification** : NextAuth (admin et marchand, cookie) ; JWT Bearer 7 jours (apps mobiles)
- **Paiement** : Versus (Wave, Orange Money, carte, Mixx) avec webhook signé
- **Services** : LocationIQ (géocodage, cartes), OneSignal (push), Google Gemini (lecture de listes)
- **Mobile** : Expo / React Native (`mobile/user-app`, `mobile/driver-app`)
- **Hébergement** : Vercel ; build Android par GitHub Actions

## Démarrage

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Variables d'environnement (`.env`, jamais versionné) :

| Variable | Rôle |
|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | PostgreSQL (pooling / migrations) |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Sessions NextAuth et signature des JWT mobiles |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Compte administrateur de secours |
| `VERSUS_BASE_URL`, `VERSUS_LOGIN`, `VERSUS_PASSWORD`, `VERSUS_WEBHOOK_SECRET` | Paiement en ligne |
| `LOCATIONIQ_KEY`, `NEXT_PUBLIC_LOCATIONIQ_KEY` | Géocodage et cartes |
| `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Notifications push |
| `GOOGLE_API_KEY` | Lecture de listes scolaires (Gemini) |
| `ACTIVE_STORE_ID` | Boutique servie par la vitrine (mode mono-boutique) |
| `MERCHANT_CODE`, `SEED_SECRET` | Routes de gestion et d'initialisation protégées |
| `CORS_ORIGINS` | Origines autorisées (séparées par des virgules) |
| `NEXT_PUBLIC_APP_URL` | URL publique (liens de paiement) |

## Entrées

- `/shop` (ou `/client`) : vitrine client
- `/dashboard` (ou `/admin`) : back-office
- `/merchant` : espace boutique
- `/livreur` : espace livreur
- `/installer` : installation des trois applications (PWA)

## Build Android (CI)

Le workflow `.github/workflows/build-apks.yml` lit le keystore depuis le secret
`ANDROID_KEYSTORE_BASE64` (valeur : `base64 -w0 papeterie-release.keystore`). Aucun keystore ne doit
être versionné.
