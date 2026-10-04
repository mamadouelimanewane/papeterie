import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { hasPerm } from "@/lib/permissions"
import { assertSessionActive } from "@/lib/mobileSession"
import { creditDriverForDelivery, DELIVERED } from "@/lib/delivery"

/**
 * Qui appelle ? Session back-office (cookie NextAuth) ou application mobile (Bearer JWT vérifié).
 * Les jetons livreur contiennent `driverId`, les jetons client `userId`.
 */
type Caller =
  | { kind: "admin"; perms: string[] }
  | { kind: "merchant"; storeId: string | null }
  | { kind: "user" | "driver"; id: string }

async function resolveCaller(req: NextRequest): Promise<Caller | null> {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (session) {
    if (session.role === "merchant") return { kind: "merchant", storeId: (session.storeId as string | undefined) ?? null }
    return { kind: "admin", perms: (session.permissions as string[] | undefined) ?? [] }
  }
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const decoded = verify(auth.slice(7), process.env.NEXTAUTH_SECRET as string) as { id: string; iat?: number; driverId?: number }
    const kind = decoded.driverId !== undefined ? "driver" : "user"
    await assertSessionActive(kind, decoded)
    return { kind, id: decoded.id }
  } catch {
    return null
  }
}

const unauthorized = () => NextResponse.json({ error: "Non authentifié" }, { status: 401 })
const forbidden = () => NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await resolveCaller(req)
    if (!caller) return unauthorized()
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, phone: true, address: true, email: true } },
        driver: { select: { name: true, phone: true, email: true, lastLocation: true } },
      },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    switch (caller.kind) {
      case "admin":
        if (!hasPerm(caller.perms, "orders.view")) return forbidden()
        return NextResponse.json(order)
      case "merchant":
        if (!caller.storeId || caller.storeId !== order.storeId) return forbidden()
        // Le code de ramassage est remis par la boutique au livreur : la boutique le voit, pas celui de livraison
        return NextResponse.json({ ...order, deliveryOtp: undefined })
      case "user":
        if (order.userId !== caller.id) return forbidden()
        // Le client communique le code de livraison au livreur ; il ne voit pas celui de ramassage
        return NextResponse.json({ ...order, pickupOtp: undefined })
      case "driver":
        if (order.driverId !== caller.id) return forbidden()
        // Le livreur obtient les codes auprès de la boutique et du client : jamais depuis l'API
        return NextResponse.json({ ...order, pickupOtp: undefined, deliveryOtp: undefined })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/** Statuts qu'un livreur peut poser lui-même sur sa commande (codes vérifiés ci-dessous). */
const DRIVER_STATUSES = ["Processing", "OnTheWay", "Delivering", "Delivered"]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await resolveCaller(req)
    if (!caller) return unauthorized()
    if (caller.kind === "user" || caller.kind === "merchant") return forbidden()
    if (caller.kind === "admin" && !hasPerm(caller.perms, "orders.manage")) return forbidden()

    const { id } = await params
    const data = await req.json()

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    if (caller.kind === "driver") {
      if (order.driverId !== caller.id) return forbidden()
      if (!DRIVER_STATUSES.includes(data.status)) return NextResponse.json({ error: "Statut non autorisé" }, { status: 400 })
    }

    const update: Record<string, unknown> = {}

    // Vérification des codes (ramassage à la boutique, remise au client)
    if (data.status === "Processing" && caller.kind === "driver") {
      if (!data.otp) return NextResponse.json({ error: "OTP de ramassage requis" }, { status: 400 })
      if (data.otp !== order.pickupOtp) return NextResponse.json({ error: "OTP de ramassage incorrect" }, { status: 400 })
    }
    if (data.status === "Delivered" && caller.kind === "driver") {
      if (!data.otp) return NextResponse.json({ error: "OTP de livraison requis" }, { status: 400 })
      if (data.otp !== order.deliveryOtp) return NextResponse.json({ error: "OTP de livraison incorrect" }, { status: 400 })
      if (!data.signature) return NextResponse.json({ error: "Signature client requise" }, { status: 400 })
    }

    // Un livreur ne modifie que le statut et la signature ; l'administration a la main sur le reste
    const allowed = caller.kind === "driver" ? ["status", "signature"] : ["status", "paymentStatus", "driverId", "notes", "signature"]
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }
    // Livreur attribué depuis le back-office : il lui faut aussi un code de ramassage (sinon il resterait bloqué à la boutique)
    if (caller.kind === "admin" && update.driverId && !order.pickupOtp) {
      update.pickupOtp = Math.floor(100000 + Math.random() * 900000).toString()
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: update,
    })

    // Livraison effectuée : le livreur est crédité de ses frais de livraison (une seule fois)
    if (update.status === "Delivered" && !DELIVERED.includes(order.status)) {
      await creditDriverForDelivery(order.id).catch((e) => console.error("[credit-livreur]", e))
    }

    if ((update.status === "Cancelled" || update.status === "Annule") && order.status !== "Cancelled" && order.status !== "Annule") {
      const items = Array.isArray(order.items) ? (order.items as { productId?: string; quantity?: number }[]) : []
      for (const item of items) {
        if (item.productId && item.quantity) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: Number(item.quantity) } },
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json(caller.kind === "driver" ? { ...updated, pickupOtp: undefined, deliveryOtp: undefined } : updated)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await resolveCaller(req)
    if (!caller) return unauthorized()
    if (caller.kind !== "admin" || !hasPerm(caller.perms, "orders.manage")) return forbidden()
    const { id } = await params
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
