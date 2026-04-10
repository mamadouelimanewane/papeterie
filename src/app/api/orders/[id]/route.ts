import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        store: true,
        driver: { select: { name: true, phone: true, email: true, lastLocation: true } },
      },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
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

    // Troubleshooting: Find order first to check OTPs
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    })

    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

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

    const allowed = ["status", "paymentStatus", "driverId", "notes", "signature"]
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }

    const updated = await prisma.order.update({ 
      where: { id: order.id }, 
      data: update 
    })
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
