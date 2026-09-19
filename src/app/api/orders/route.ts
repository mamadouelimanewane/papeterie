import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? "10")))
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const storeId = searchParams.get("storeId") ?? ""
    const dateFrom = searchParams.get("dateFrom") ?? ""
    const dateTo = searchParams.get("dateTo") ?? ""

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (storeId) where.storeId = storeId
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
      }
    }
    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: "insensitive" } },
        { invoiceId: { contains: search, mode: "insensitive" } },
        { userId: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          store: { select: { name: true, address: true } },
          driver: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, perPage, totalPages: Math.ceil(total / perPage) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Mode mono-boutique : si aucune boutique n'est precisee, on utilise la boutique active.
    const { getActiveStoreId } = await import("@/lib/store")
    const storeId: string | null = data.storeId ?? (await getActiveStoreId())

    if (!storeId || !data.total || !data.items) {
      return NextResponse.json({ error: "storeId (ou boutique active), total et items sont requis" }, { status: 400 })
    }

    // Extraire userId depuis le token JWT si présent
    let userId: string | null = null
    const authHeader = req.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { verify } = await import("jsonwebtoken")
        const JWT_SECRET = (process.env.NEXTAUTH_SECRET as string)
        const decoded = verify(authHeader.split(" ")[1], JWT_SECRET) as { id: string }
        userId = decoded.id
      } catch {}
    }

    const items = Array.isArray(data.items) ? data.items : [];

    const order = await prisma.$transaction(async (tx) => {
      // 1. Verifier et decrementer le stock
      const productIds = items.map((i: any) => i.productId).filter(Boolean);
      if (productIds.length > 0) {
        const productsInDb = await tx.product.findMany({ where: { id: { in: productIds } } });
        
        for (const item of items) {
           if (!item.productId) continue;
           const prod = productsInDb.find(p => p.id === item.productId);
           if (!prod) {
             throw new Error(`Produit introuvable : ${item.name}`);
           }
           if (typeof prod.stock === "number" && prod.stock < item.quantity) {
             throw new Error(`Stock insuffisant pour : ${item.name} (Reste : ${prod.stock})`);
           }
        }
        
        for (const item of items) {
           if (!item.productId) continue;
           await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
           });
        }
      }

      const orderId = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000)
      const invoiceId = "INV-" + orderId.split("-")[1]
      const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString()

      return tx.order.create({
        data: {
          orderId,
          invoiceId,
          storeId,
          userId: userId ?? data.userId ?? null,
          total: Number(data.total),
          subtotal: Number(data.subtotal ?? data.total),
          deliveryFee: Number(data.deliveryFee ?? 500),
          earning: Number(data.total) * 0.1,
          status: "Pending",
          paymentMethod: data.paymentMethod ?? "Cash",
          paymentStatus: "En attente",
          items: data.items,
          address: data.address ?? null,
          notes: [data.notes, data.promoCode ? `[Promo: ${data.promoCode}]` : null].filter(Boolean).join(" ") || null,
          deliveryOtp,
        },
      });
    });

    // Code promo : incremente le compteur d'utilisation (best-effort)
    if (data.promoCode) {
      try {
        await prisma.promoCode.update({
          where: { code: String(data.promoCode).trim().toUpperCase() },
          data: { usedCount: { increment: 1 } },
        })
      } catch {}
    }

    let paymentData: unknown = null;
    let paymentError: string | null = null;
    const versusMethods = ["Versus", "Wave", "Orange", "Orange Money"];
    const wantsVersus =
      versusMethods.includes(order.paymentMethod) || versusMethods.includes(data.paymentMethod);
    if (wantsVersus) {
      try {
        const { createVersusPayment } = await import("@/lib/versus");

        // Option 1 : on initie le paiement sans service spécifique, pour récupérer le lien de paiement
        const paymentResult = await createVersusPayment({
          name: "Commande Papeterie " + order.orderId,
          first_name: data.firstName ?? "Client",
          last_name: data.lastName ?? "Papeterie",
          external_reference: order.id, // Utilisé dans le webhook pour retrouver la commande
          order_reference: order.orderId,
          amount: order.total,
          currency: "XOF",
          phone_number: data.phone_number, // Optionnel
          success_url: `https://${req.headers.get("host")}/checkout/success?orderId=${order.orderId}`,
          failure_url: `https://${req.headers.get("host")}/checkout/failure?orderId=${order.orderId}`,
          ...(data.service_id && data.payment_account_number ? {
            service_id: data.service_id,
            payment_account_number: data.payment_account_number
          } : {}) // Option 2 (Mobile Money Direct)
        });

        if (paymentResult.success) {
          paymentData = paymentResult;
        } else {
          paymentError = paymentResult.message ?? "Echec de l'initialisation du paiement Versus";
        }
      } catch (err) {
        console.error("Erreur création paiement Versus:", err);
        paymentError = err instanceof Error ? err.message : "Erreur d'initialisation du paiement Versus";
      }
    }

    // paymentInitiated = false si un paiement Versus était demandé mais n'a pas pu être initié.
    const paymentInitiated = !wantsVersus || paymentData !== null;

    return NextResponse.json(
      { ...order, paymentData, paymentInitiated, paymentError },
      { status: 201 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
