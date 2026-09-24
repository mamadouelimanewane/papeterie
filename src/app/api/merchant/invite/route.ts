import { NextRequest, NextResponse } from "next/server"
import { findStoreByInvite } from "@/lib/merchantAuth"

/** Vérifie un lien d'invitation (public) : renvoie uniquement nom et e-mail de la boutique. */
export async function GET(req: NextRequest) {
  const store = await findStoreByInvite(req.nextUrl.searchParams.get("token") ?? "")
  if (!store) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 })
  return NextResponse.json({ name: store.name, email: store.email, expiresAt: store.inviteExpiresAt })
}
