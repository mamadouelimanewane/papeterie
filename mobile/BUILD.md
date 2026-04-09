# NDUGUMi Mobile Apps — Build Guide

## État des apps (mis à jour)

### User App — Écrans complétés
| Écran | Chemin | Statut |
|-------|--------|--------|
| Splash | auth/SplashScreen.tsx | ✅ |
| Login | auth/LoginScreen.tsx | ✅ |
| Register | auth/RegisterScreen.tsx | ✅ |
| Accueil | home/HomeScreen.tsx | ✅ |
| Panier | cart/CartScreen.tsx | ✅ |
| Commandes | orders/OrdersScreen.tsx | ✅ |
| Détail commande | orders/OrderDetailScreen.tsx | ✅ |
| Notifications | notifications/NotificationsScreen.tsx | ✅ |
| Portefeuille | wallet/WalletScreen.tsx | ✅ |
| Profil | profile/ProfileScreen.tsx | ✅ |

### Driver App — Écrans complétés
| Écran | Chemin | Statut |
|-------|--------|--------|
| Splash | auth/SplashScreen.tsx | ✅ |
| Login | auth/LoginScreen.tsx | ✅ |
| Tableau de bord | home/HomeScreen.tsx | ✅ |
| Commandes disponibles | orders/OrdersScreen.tsx | ✅ |
| Livraison active | delivery/ActiveDeliveryScreen.tsx | ✅ |
| Documents | documents/DocumentsScreen.tsx | ✅ |
| Gains | earnings/EarningsScreen.tsx | ✅ |
| Notifications | notifications/NotificationsScreen.tsx | ✅ |
| Profil | profile/ProfileScreen.tsx | ✅ |

## Variables d'environnement requises (eas.json → env)

```
EXPO_PUBLIC_ONESIGNAL_APP_ID=votre-app-id   ← OneSignal App ID
API_URL=https://papeterie.vercel.app/api          ← URL de l'API backend
```

## Étape obligatoire avant le premier build : projectId EAS

1. Créer un compte sur https://expo.dev
2. Dans chaque dossier app :
   ```bash
   cd mobile/user-app && eas init
   cd mobile/driver-app && eas init
   ```
3. Copier le projectId généré dans chaque `app.json` → `extra.eas.projectId`

---

## Applications

| App | Path | Bundle ID (Android) | Bundle ID (iOS) |
|-----|------|---------------------|-----------------|
| User App | `mobile/user-app/` | `com.ndugumi.userapp` | `com.ndugumi.userapp` |
| Driver App | `mobile/driver-app/` | `com.ndugumi.driverapp` | `com.ndugumi.driverapp` |

---

## Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login
```

---

## 1. Local Development (Expo Go)

```bash
# User App
cd mobile/user-app
npm install
npx expo start

# Driver App
cd mobile/driver-app
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.

---

## 2. Build APK (Android) — Internal Testing

```bash
# User App APK
cd mobile/user-app
eas build --platform android --profile preview

# Driver App APK
cd mobile/driver-app
eas build --platform android --profile preview
```

This produces a `.apk` file downloadable from the EAS dashboard. Install directly on Android devices.

---

## 3. Build IPA (iOS) — Simulator

```bash
# User App (iOS Simulator)
cd mobile/user-app
eas build --platform ios --profile development

# Driver App (iOS Simulator)
cd mobile/driver-app
eas build --platform ios --profile development
```

---

## 4. Production Build

### Android (AAB for Play Store)
```bash
cd mobile/user-app
eas build --platform android --profile production

cd mobile/driver-app
eas build --platform android --profile production
```

### iOS (IPA for App Store)
```bash
cd mobile/user-app
eas build --platform ios --profile production

cd mobile/driver-app
eas build --platform ios --profile production
```

---

## 5. Build Both Platforms at Once

```bash
eas build --platform all --profile preview
```

---

## 6. Submit to Stores

```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

---

## Environment Variables

Update the `API_URL` in `eas.json` for each environment:

| Environment | URL |
|-------------|-----|
| Development | `https://papeterie.vercel.app/api` |
| Preview | `https://papeterie.vercel.app/api` |
| Production | `https://papeterie.vercel.app/api` |

---

## First-Time EAS Setup

1. Create an Expo account at https://expo.dev
2. Run `eas init` in each app directory to get a project ID
3. Update `app.json` → `extra.eas.projectId` with your real project ID
4. For iOS: provide Apple Developer account credentials when prompted
5. For Android: EAS generates a keystore automatically on first build

---

## Project Structure

```
mobile/
├── user-app/               # Client / Shopper app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/       # Splash, Login, Register
│   │   │   ├── home/       # Home (banners, categories, stores)
│   │   │   ├── orders/     # Order history & tracking
│   │   │   ├── cart/       # Shopping cart & checkout
│   │   │   └── profile/    # User profile & wallet
│   │   ├── navigation/     # Stack + BottomTab navigator
│   │   ├── store/          # Zustand (auth + cart + notifications)
│   │   ├── services/       # Axios API client
│   │   └── constants/      # Theme colors, fonts, spacing
│   ├── app.json
│   └── eas.json
│
└── driver-app/             # Livreur / Delivery driver app
    ├── src/
    │   ├── screens/
    │   │   ├── auth/       # Splash, Login
    │   │   ├── home/       # Dashboard (online toggle, orders)
    │   │   ├── delivery/   # Active delivery flow (3 steps)
    │   │   ├── earnings/   # Earnings chart & history
    │   │   ├── profile/    # Driver profile & wallet
    │   │   └── documents/  # Document upload & status
    │   ├── navigation/     # Stack + BottomTab navigator
    │   ├── store/          # Zustand driver store
    │   └── constants/      # Theme (violet #6B6BD5)
    ├── app.json
    └── eas.json
```
