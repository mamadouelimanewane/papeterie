import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Inscription client depuis la vitrine publique (/shop) : prénom, nom, téléphone.
 * Pas de mot de passe (le compte mobile avec mot de passe reste /api/user/register).
 * Ne renvoie jamais de données d'un compte existant (pas de fuite par numéro).
 */

// Numéros sénégalais : 9 chiffres commençant par 7 (mobile) ou 3 (fixe), +221/00221 optionnel.
function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[\s.\-()]/g, "")
  if (d.startsWith("+221")) d = d.slice(4)
  else if (d.startsWith("00221")) d = d.slice(5)
  else if (d.startsWith("221") && d.length === 12) d = d.slice(3)
  return /^[37]\d{8}$/.test(d) ? d : null
}

const clean = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : "")
const NAME_RE = /^[\p{L}][\p{L}' -]{0,59}$/u

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    // Pot de miel anti-robots : champ caché qu'un humain ne remplit jamais.
    if (body.website) return NextResponse.json({ ok: true }, { status: 201 })

    const firstName = clean(body.firstName)
    const lastName = clean(body.lastName)
    const phone = normalizePhone(clean(body.phone))

    if (!NAME_RE.test(firstName) || !NAME_RE.test(lastName)) {
      return NextResponse.json({ error: "Prénom et nom requis (lettres uniquement)" }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: "Numéro de téléphone invalide (ex : 77 123 45 67)" }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, { email: `${phone}@papeterie.sn` }] },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ ok: true, alreadyRegistered: true })
    }

    // La séquence autoincrement de userId est désynchronisée (seed avec ids explicites) :
    // on calcule max+1 comme /api/user/register, avec nouvel essai si deux inscriptions se croisent.
    for (let attempt = 0; ; attempt++) {
      const last = await prisma.user.findFirst({ orderBy: { userId: "desc" }, select: { userId: true } })
      try {
        await prisma.user.create({
          data: {
            userId: (last?.userId ?? 0) + 1,
            name: `${firstName} ${lastName}`,
            phone,
            email: `${phone}@papeterie.sn`,
            status: "Active",
            userType: "Retail",
            signupType: "Web",
            signupFrom: "Site web (/shop)",
            country: "Sénégal",
          },
        })
        break
      } catch (e) {
        const target = (e as { code?: string; meta?: { target?: unknown } })
        if (target.code === "P2002" && attempt < 3 && String(target.meta?.target ?? "userId").includes("userId")) continue
        if (target.code === "P2002") return NextResponse.json({ ok: true, alreadyRegistered: true })
        throw e
      }
    }

    return NextResponse.json({ ok: true, alreadyRegistered: false }, { status: 201 })
  } catch (error) {
    console.error("[shop/register]", error)
    return NextResponse.json({ error: "Erreur serveur, réessayez" }, { status: 500 })
  }
}
