import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Protect API routes (except auth)
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
      if (!token) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
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

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let our custom middleware handle authorization
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
