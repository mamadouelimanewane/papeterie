import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { findClientInvite, splitName, type ClientInviteData } from "@/lib/clientInvites"

/**
 * Lien d'invitation d'un client (public) : POST { code, event: "open" | "installed" }.
 * - open      : renvoie le profil à pré-remplir dans la vitrine (prénom, nom, téléphone) et note la 1re ouverture ;
 * - installed : note l'installation de l'application.
 * Aucune connexion au compte, aucune autre donnée renvoyée.
 */
export async function POST(req: Request) {
  if (!rateLimit("shop-invite:" + clientIp(req), 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans quelques minutes" }, { status: 429 })
  }
  try {
    const { code, event } = await req.json().catch(() => ({}))
    const invite = typeof code === "string" ? await findClientInvite(code) : null
    if (!invite) return NextResponse.json({ error: "Invitation introuvable ou expirée" }, { status: 404 })

    const now = new Date().toISOString()
    const next: ClientInviteData = {
      ...invite.data,
      openedAt: invite.data.openedAt ?? now,
      installedAt: event === "installed" ? invite.data.installedAt ?? now : invite.data.installedAt,
    }
    if (next.openedAt !== invite.data.openedAt || next.installedAt !== invite.data.installedAt) {
      await prisma.adminRecord.update({ where: { id: invite.id }, data: { data: next } })
    }

    const { firstName, lastName } = splitName(invite.data.name)
    return NextResponse.json({ firstName, lastName, phone: invite.data.phone })
  } catch (e) {
    console.error("[shop/invite]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
