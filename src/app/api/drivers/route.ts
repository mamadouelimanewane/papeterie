import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? "25")))
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const approvalStatus = searchParams.get("approvalStatus") ?? ""
    const serviceArea = searchParams.get("serviceArea") ?? ""
    const country = searchParams.get("country") ?? ""

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (approvalStatus) where.approvalStatus = approvalStatus
    if (serviceArea) where.serviceArea = serviceArea
    if (country) where.country = country
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ]
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: { documents: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.driver.count({ where }),
    ])

    return NextResponse.json({ drivers, total, page, perPage, totalPages: Math.ceil(total / perPage) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.name || !data.email) {
      return NextResponse.json({ error: "name et email sont requis" }, { status: 400 })
    }

    const last = await prisma.driver.findFirst({ orderBy: { driverId: "desc" } })
    const driverId = (last?.driverId ?? 0) + 1

    const driver = await prisma.driver.create({
      data: {
        driverId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        serviceArea: data.serviceArea ?? null,
        country: data.country ?? null,
        vehicleType: data.vehicleType ?? null,
        approvalStatus: "Pending",
        status: "Offline",
      },
    })
    return NextResponse.json(driver, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
