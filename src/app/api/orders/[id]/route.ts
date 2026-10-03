import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hasAdminSession, verifyBearer } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await hasAdminSession()
    const bearer = verifyBearer(req)
    if (!admin && !bearer) return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        store: true,
        driver: { select: { name: true, phone: true, email: true, lastLocation: true } },
      },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    if (!admin) {
      const isOwner = order.userId === bearer!.id
      const isDriver = order.driverId === bearer!.id
      if (!isOwner && !isDriver) return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
      // Le livreur ne voit pas l'OTP de livraison : c'est le client qui le lui communique.
      if (!isOwner) return NextResponse.json({ ...order, deliveryOtp: undefined })
    }
    return NextResponse.json(order)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const admin = await hasAdminSession()
    const bearer = verifyBearer(req)
    if (!admin && !bearer) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

    // Troubleshooting: Find order first to check OTPs
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    })

    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    // Un livreur (JWT) ne peut agir que sur ses commandes et ne modifie que statut/signature.
    if (!admin && order.driverId !== bearer!.id) {
      return NextResponse.json({ error: "Commande non assignee" }, { status: 403 })
    }

    const update: Record<string, unknown> = {}
    
    // OTP Verification logic
    if (data.status === "Processing") {
      if (!data.otp) return NextResponse.json({ error: "OTP de ramassage requis" }, { status: 400 })
      if (data.otp !== order.pickupOtp) return NextResponse.json({ error: "OTP de ramassage incorrect" }, { status: 400 })
    }

    if (data.status === "Delivered") {
      if (!data.otp) return NextResponse.json({ error: "OTP de livraison requis" }, { status: 400 })
      if (data.otp !== order.deliveryOtp) return NextResponse.json({ error: "OTP de livraison incorrect" }, { status: 400 })
      if (!data.signature) return NextResponse.json({ error: "Signature client requise" }, { status: 400 })
      update.signature = data.signature
    }

    const allowed = admin ? ["status", "paymentStatus", "driverId", "notes", "signature"] : ["status", "signature"]
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }

    const updated = await prisma.order.update({ 
      where: { id: order.id }, 
      data: update 
    })

    if ((update.status === "Cancelled" || update.status === "Annule") && (order.status !== "Cancelled" && order.status !== "Annule")) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items as any[]) {
        if (item.productId && item.quantity) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: Number(item.quantity) } }
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
