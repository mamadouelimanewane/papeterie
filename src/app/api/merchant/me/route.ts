import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { isResponse, errorResponse } from "@/lib/adminAuth"

const PUBLIC_FIELDS = {
  id: true, name: true, email: true, phone: true, address: true, image: true, rating: true,
  walletMoney: true, status: true, serviceArea: true, segment: true, createdAt: true, lastLoginAt: true,
  _count: { select: { orders: true, products: true } },
} as const

/** Profil de la boutique connectée. */
export async function GET(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  const store = await prisma.store.findUnique({ where: { id: auth.storeId }, select: PUBLIC_FIELDS })
  return NextResponse.json(store)
}

/** Le marchand ne modifie que ses coordonnées ; nom, e-mail, statut et solde restent gérés par l'admin. */
export async function PATCH(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const b = await req.json()
    const data: Record<string, string | null> = {}
    for (const key of ["phone", "address", "image"] as const) {
      if (key in b) {
        const v = b[key] === null ? null : String(b[key]).trim().slice(0, key === "image" ? 2000 : 300)
        data[key] = v || null
      }
    }
    const store = await prisma.store.update({ where: { id: auth.storeId }, data, select: PUBLIC_FIELDS })
    return NextResponse.json(store)
  } catch (e) { return errorResponse(e) }
}
