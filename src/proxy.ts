import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

function hasBearerToken(req: { headers: Headers }): boolean {
  const a = req.headers.get("authorization")
  return !!a?.startsWith("Bearer ")
}

/**
 * AccÃ¨s sans cookie NextAuth : inscription, catalogue, commande invitÃ©, etc.
 * Les apps mobiles envoient un JWT (`Authorization: Bearer`) â€” gÃ©rÃ© ici.
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
    if (pathname === "/api/orders") return true
    if (pathname === "/api/admin/seed") return true
    if (pathname === "/api/admin/fix-images") return true
  }

  if (method === "GET") {
    if (pathname === "/api/slider") return true
    if (pathname.startsWith("/api/stores")) return true
    if (pathname.startsWith("/api/categories")) return true
    if (pathname === "/api/countries" || pathname === "/api/service-areas") return true
    if (pathname.startsWith("/api/promo-codes")) return true
    if (pathname === "/api/driver/orders/available") return true
  }

  return false
}

function apiAllowed(req: { headers: Headers; nextauth: { token: unknown } }, pathname: string, method: string) {
  if (req.nextauth.token) return true
  if (hasBearerToken(req)) return true
  if (isPublicApiRoute(pathname, method)) return true
  return false
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl

    // 1) CORS Preflight Handling (OPTIONS)
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    const token = req.nextauth.token

    // API : session admin (web) OU JWT Bearer (mobile) OU route publique
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
      if (!apiAllowed(req, pathname, req.method)) {
        return NextResponse.json(
          { error: "Non authentifiÃ©" },
          {
            status: 401,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            },
          }
        )
      }
    }

    // Protect merchant routes
    if (pathname.startsWith("/merchant/") && !pathname.startsWith("/merchant/login")) {
      if (!token) {
        return NextResponse.redirect(new URL("/merchant/login", req.url))
      }
    }

    // Protect dashboard routes
    if (
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/merchant/login") &&
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/favicon")
    ) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url))
      }
    }

    const response = NextResponse.next()

    // Apply CORS headers for all API requests
    if (pathname.startsWith("/api/")) {
      response.headers.set("Access-Control-Allow-Origin", "*")
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    }

    return response
  },
  {
    callbacks: {
      authorized: () => true, // Let custom middleware handle authorization logic
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

