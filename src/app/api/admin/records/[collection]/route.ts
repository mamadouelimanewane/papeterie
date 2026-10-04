import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { RECORD_COLLECTIONS, flatRecord, stripMeta } from "@/lib/recordCollections"

type Params = { params: Promise<{ collection: string }> }
export async function GET(req: NextRequest, { params }: Params) {
  const { collection } = await params
  const perms = RECORD_COLLECTIONS[collection]
  if (!perms) return NextResponse.json({ error: "Collection inconnue" }, { status: 404 })
  const auth = await requireAdmin(req, perms.view)
  if (isResponse(auth)) return auth
  try {
    const rows = await prisma.adminRecord.findMany({ where: { collection }, orderBy: [{ sequence: "asc" }, { createdAt: "asc" }] })
    return NextResponse.json(rows.map(flatRecord))
  } catch (e) { return errorResponse(e) }
}

/** Création. `?seed=1` + tableau : données de départ, uniquement si la collection est vide. */
export async function POST(req: NextRequest, { params }: Params) {
  const { collection } = await params
  const perms = RECORD_COLLECTIONS[collection]
  if (!perms) return NextResponse.json({ error: "Collection inconnue" }, { status: 404 })
  const auth = await requireAdmin(req, perms.manage)
  if (isResponse(auth)) return auth
  try {
    const body = await req.json()
    if (req.nextUrl.searchParams.get("seed") === "1") {
      if (!Array.isArray(body)) return NextResponse.json({ error: "Tableau attendu" }, { status: 400 })
      if ((await prisma.adminRecord.count({ where: { collection } })) > 0) return NextResponse.json({ seeded: 0 })
      const r = await prisma.adminRecord.createMany({
        data: body.map((o: Record<string, unknown>, i: number) => ({ collection, data: stripMeta(o) as object, sequence: i })),
      })
      return NextResponse.json({ seeded: r.count })
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Objet attendu" }, { status: 400 })
    const last = await prisma.adminRecord.findFirst({ where: { collection }, orderBy: { sequence: "desc" }, select: { sequence: true } })
    const row = await prisma.adminRecord.create({ data: { collection, data: stripMeta(body) as object, sequence: (last?.sequence ?? -1) + 1 } })
    return NextResponse.json(flatRecord(row), { status: 201 })
  } catch (e) { return errorResponse(e) }
}
