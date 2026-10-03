import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { hasPerm, permForApi } from "@/lib/permissions"

// CORS : l'admin et la vitrine sont same-origin et les apps mobiles natives n'en ont pas
// besoin. Seules les origines listees dans CORS_ORIGINS (separees par des virgules) sont autorisees.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean)

function corsHeaders(req: { headers: Headers }): Record<string, string> {
  const origin = req.headers.get("origin")
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {}
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    Vary: "Origin",
  }
}

function hasBearerToken(req: { headers: Headers }): boolean {
  const a = req.headers.get("authorization")
  return !!a?.startsWith("Bearer ")
}

/**
 * Routes 100% publiques : inscription, connexion, catalogue, commande invite,
 * webhook (signature verifiee cote route) et seed (cle secrete cote route).
 */
function isPublicApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/auth")) return true

  if (method === "POST") {
    if (
      pathname === "/api/user/register" ||
      pathname === "/api/user/login" ||
      pathname === "/api/driver/login" ||
      pathname === "/api/driver/register"
    ) {
      return true
    }
    if (pathname === "/api/orders") return true // commande invite
    if (pathname === "/api/gestion") return true // protege par MERCHANT_CODE dans la route
    if (pathname === "/api/promo") return true // validation code promo (vitrine)
    if (pathname === "/api/webhooks/versus") return true // signature verifiee dans la route
    if (pathname === "/api/admin/seed") return true // protege par SEED_SECRET
    if (pathname === "/api/admin/fix-images") return true // protege par SEED_SECRET
  }

  if (method === "GET") {
    if (pathname === "/api/slider") return true
    if (pathname === "/api/store") return true // boutique active (vitrine mono-boutique)
    if (pathname === "/api/kits") return true // kits par classe (vitrine)
    if (pathname.startsWith("/api/stores")) return true
    if (pathname.startsWith("/api/categories")) return true
    if (pathname === "/api/countries" || pathname === "/api/service-areas") return true
    if (pathname.startsWith("/api/promo-codes")) return true
  }

  return false
}

/**
 * Routes accessibles aux apps mobiles avec un JWT `Authorization: Bearer`.
 * Le JWT est *reellement* verifie dans chaque route (runtime Node) ; le
 * middleware ne fait ici qu'autoriser le passage vers ces routes.
 */
function isMobileApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/user/")) return true // profil...
  if (pathname.startsWith("/api/wallet/")) return true
  if (pathname.startsWith("/api/driver/")) return true // earnings, location, orders, status...
  if (pathname === "/api/orders/my") return true
  if (pathname === "/api/orders/update") return true // livreur : mise a jour statut
  // detail / mise a jour de statut : JWT verifie dans la route
  if ((method === "GET" || method === "PATCH") && /^\/api\/orders\/[^/]+$/.test(pathname)) return true
  return false
}

/**
 * Decide si une requete API peut passer le middleware.
 * - route publique -> oui
 * - route mobile   -> oui si un Bearer est present (verifie ensuite dans la route)
 * - tout le reste (administration) -> UNIQUEMENT session NextAuth (cookie admin)
 *
 * Important : un simple en-tete `Bearer` n'ouvre plus les routes d'administration.
 */
function apiAllowed(
  req: { headers: Headers; nextauth: { token: unknown } },
  pathname: string,
  method: string
): "ok" | "unauthenticated" | "forbidden" {
  if (isPublicApiRoute(pathname, method)) return "ok"
  // Session admin (cookie NextAuth) : acces selon les permissions RBAC du role.
  const token = req.nextauth.token as { permissions?: string[] } | null
  if (token) {
    return hasPerm(token.permissions, permForApi(pathname, method)) ? "ok" : "forbidden"
  }
  // Routes mobiles : necessitent un Bearer, dont la validite est controlee par la route.
  if (isMobileApiRoute(pathname, method) && hasBearerToken(req)) return "ok"
  return "unauthenticated"
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl

    // 1) Preflight CORS
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: { ...corsHeaders(req), "Access-Control-Max-Age": "86400" },
      })
    }

    const token = req.nextauth.token

    // 2) API : session admin OU JWT mobile (route mobile) OU route publique
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
      const access = apiAllowed(req, pathname, req.method)
      if (access !== "ok") {
        return NextResponse.json(
          { error: access === "forbidden" ? "Permission insuffisante" : "Non authentifie" },
          { status: access === "forbidden" ? 403 : 401, headers: corsHeaders(req) }
        )
      }
    }

    // 3) Espace marchand
    if (pathname.startsWith("/merchant/") && !pathname.startsWith("/merchant/login")) {
      if (!token) return NextResponse.redirect(new URL("/merchant/login", req.url))
    }

    // 4) Dashboard admin
    if (
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/merchant/login") &&
      !pathname.startsWith("/shop") &&      // interface client de test (publique)
      !pathname.startsWith("/gestion") &&   // interface marchande (protegee par code cote page)
      !pathname.startsWith("/livreur") &&   // interface livreur de test (publique)
      !pathname.startsWith("/checkout") &&  // retours de paiement Versus
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/favicon") &&
      !/\.(png|jpg|jpeg|svg|gif|webp|ico|txt|xml|json|woff2?|ttf)$/i.test(pathname) // fichiers statiques
    ) {
      if (!token) return NextResponse.redirect(new URL("/login", req.url))
    }

    const response = NextResponse.next()
    if (pathname.startsWith("/api/")) {
      for (const [k, v] of Object.entries(corsHeaders(req))) response.headers.set(k, v)
    }
    return response
  },
  {
    callbacks: {
      authorized: () => true, // la logique d'autorisation est geree ci-dessus
    },
  }
)

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
