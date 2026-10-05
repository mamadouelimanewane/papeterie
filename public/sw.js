/* Service worker Schoolmatik — client, livreur et admin (une seule portée : « / »).
 *
 * Rôle : rendre les applications installables et utilisables avec un réseau instable.
 *  - JAMAIS de cache pour /api/* (données, authentification, paiements) : toujours le réseau ;
 *  - pages : réseau d'abord ; hors connexion, une page « Pas de connexion » ;
 *  - fichiers statiques (code, icônes, images de la vitrine) : servis depuis le cache puis rafraîchis en arrière-plan.
 * Les notifications push (OneSignal) passent par ce même fichier : le script de OneSignal est importé ci-dessous.
 */
try { importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js") } catch (e) { /* hors ligne : push indisponible, le reste fonctionne */ }

const VERSION = "v1"
const CACHE = "schoolmatik-static-" + VERSION
const OFFLINE_URL = "/offline.html"
const PRECACHE = [OFFLINE_URL, "/pwa/client-192.png", "/pwa/livreur-192.png", "/pwa/admin-192.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("schoolmatik-static-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isStatic = (p) =>
  p.startsWith("/_next/static/") || p.startsWith("/pwa/") || p.startsWith("/generic/") || p.startsWith("/products/")

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return // jamais en cache

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  if (isStatic(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req)
        const network = fetch(req)
          .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res })
          .catch(() => cached)
        return cached || network
      }),
    )
  }
})
