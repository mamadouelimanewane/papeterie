import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CRUD_MODELS, coerce } from "@/lib/crudModels"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

type Params = { params: Promise<{ model: string }> }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (name: string) => (prisma as any)[name]

export async function GET(req: NextRequest, { params }: Params) {
  const { model } = await params
  const def = CRUD_MODELS[model]
  if (!def) return NextResponse.json({ error: "Module inconnu" }, { status: 404 })
  const auth = await requireAdmin(req, def.view)
  if (isResponse(auth)) return auth
  try {
    const rows = await delegate(def.delegate).findMany({ orderBy: def.orderBy, include: def.include, take: 1000 })
    return NextResponse.json(rows)
  } catch (e) { return errorResponse(e) }
}

/** Création. `?seed=1` + tableau : remplit la table UNIQUEMENT si elle est vide (données de départ). */
export async function POST(req: NextRequest, { params }: Params) {
  const { model } = await params
  const def = CRUD_MODELS[model]
  if (!def || def.readOnly) return NextResponse.json({ error: "Module inconnu" }, { status: 404 })
  const auth = await requireAdmin(req, def.manage)
  if (isResponse(auth)) return auth
  try {
    const body = await req.json()
    const d = delegate(def.delegate)
    if (req.nextUrl.searchParams.get("seed") === "1") {
      if (!Array.isArray(body)) return NextResponse.json({ error: "Tableau attendu" }, { status: 400 })
      if ((await d.count()) > 0) return NextResponse.json({ seeded: 0 })
      const data = body.map((row: Record<string, unknown>) => coerce(def, row, false))
      const r = await d.createMany({ data, skipDuplicates: true })
      return NextResponse.json({ seeded: r.count })
    }
    const row = await d.create({ data: coerce(def, body, false), include: def.include })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    if (e instanceof Error && /^Champ /.test(e.message)) return NextResponse.json({ error: e.message }, { status: 400 })
    return errorResponse(e)
  }
}
