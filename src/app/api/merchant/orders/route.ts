import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { MERCHANT_ORDER_SELECT } from "@/lib/merchantApi"
import { isResponse, errorResponse } from "@/lib/adminAuth"

/** Commandes de la boutique connectée. Query : status, search, take */
export async function GET(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const sp = req.nextUrl.searchParams
    const status = sp.get("status") ?? ""
    const search = (sp.get("search") ?? "").trim()
    const take = Math.min(Math.max(Number(sp.get("take")) || 200, 1), 500)
    const orders = await prisma.order.findMany({
      where: {
        storeId: auth.storeId,
        ...(status ? { status: status === "Cancelled" ? { in: ["Cancelled", "Annule"] } : status } : {}),
        ...(search
          ? {
              OR: [
                { orderId: { contains: search, mode: "insensitive" as const } },
                { address: { contains: search, mode: "insensitive" as const } },
                { notes: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      select: MERCHANT_ORDER_SELECT,
    })
    return NextResponse.json(orders)
  } catch (e) { return errorResponse(e) }
}
