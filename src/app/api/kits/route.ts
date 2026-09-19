import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveStoreId } from "@/lib/store"

// Kits de fournitures par classe de la boutique active (route publique)
export async function GET() {
  try {
    const storeId = await getActiveStoreId()
    if (!storeId) return NextResponse.json([])
    const kits = await prisma.kit.findMany({
      where: { storeId, status: "Active" },
      orderBy: { sequence: "asc" },
    })
    return NextResponse.json(kits)
  } catch (error) {
    console.error("[api/kits]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
