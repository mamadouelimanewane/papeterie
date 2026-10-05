import type { NextConfig } from "next";

// En-têtes de sécurité appliqués à toutes les réponses.
// CSP volontairement limitée aux directives sans risque de casser Next.js / Leaflet / OneSignal :
// interdit l'intégration du site dans une iframe (clickjacking), les <base> externes, les plugins et les formulaires vers un autre site.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Adresses d'entrée courtes, à donner aux utilisateurs : /client, /livreur, /admin (et /installer pour les trois)
  async redirects() {
    return [
      { source: "/client", destination: "/shop?source=pwa", permanent: false },
      { source: "/admin", destination: "/dashboard?source=pwa", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Le service worker doit toujours être revalidé (une nouvelle version est prise en compte rapidement)
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
      // Images de la vitrine : 7 jours en cache navigateur/CDN (le défaut de Next pour public/ est « à revalider à chaque fois »)
      { source: "/generic/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/products/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
