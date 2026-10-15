import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isResponse, requireAdminApi, errorResponse } from "@/lib/adminAuth"

export async function GET() {
  try {
    const areas = await prisma.serviceArea.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json(areas)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/service-areas]")
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const data = await req.json()
    if (!data.name || !data.country) {
      return NextResponse.json({ error: "name et country sont requis" }, { status: 400 })
    }
    const area = await prisma.serviceArea.create({
      data: { name: data.name, country: data.country, status: data.status ?? "Active" },
    })
    return NextResponse.json(area, { status: 201 })
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/service-areas]")
  }
}
