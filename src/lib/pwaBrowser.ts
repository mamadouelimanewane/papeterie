/**
 * Samsung Internet fabrique lui-même l'application installée, dans un format ancien que Google Play Protect
 * bloque sur Android récent (« Appli non sécurisée bloquée : conçue pour une version plus ancienne d'Android »).
 * Sur ce navigateur, on propose d'installer depuis Chrome, dont les applications sont générées par Google.
 */
export const isSamsungBrowser = (ua: string) => /SamsungBrowser/i.test(ua)

/** Lien Android qui ouvre `url` dans Chrome (repli : la même adresse dans le navigateur courant). */
export function openInChromeUrl(url: string) {
  const u = new URL(url)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`
}
