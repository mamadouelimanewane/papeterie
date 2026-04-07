import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const banners = await prisma.sliderBanner.findMany({
      where: { status: "Active" },
      orderBy: { sequence: "asc" },
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error("[slider-get]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
