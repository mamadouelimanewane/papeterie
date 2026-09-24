import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

type Params = { params: Promise<{ key: string }> }
const KEY_RE = /^[a-z0-9-]{1,60}$/

/**
 * Champs secrets (mots de passe, clés d'API…) : jamais renvoyés au navigateur.
 * Le GET renvoie MASK à la place ; un PUT qui renvoie MASK conserve la valeur enregistrée.
 */
const SECRET_RE = /(password|secret|key|token)$/i
const MASK = "••••••••"

type Obj = Record<string, unknown>
const mask = (v: Obj) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SECRET_RE.test(k) && x ? MASK : x]))

export async function GET(req: NextRequest, { params }: Params) {
  const { key } = await params
  if (!KEY_RE.test(key)) return NextResponse.json({ error: "Clé invalide" }, { status: 400 })
  const auth = await requireAdmin(req, "settings.view")
  if (isResponse(auth)) return auth
  try {
    const s = await prisma.appSetting.findUnique({ where: { key } })
    return NextResponse.json({ value: s ? mask(s.value as Obj) : null, updatedAt: s?.updatedAt ?? null })
  } catch (e) { return errorResponse(e) }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { key } = await params
  if (!KEY_RE.test(key)) return NextResponse.json({ error: "Clé invalide" }, { status: 400 })
  const auth = await requireAdmin(req, "settings.manage")
  if (isResponse(auth)) return auth
  try {
    const { value } = await req.json()
    if (!value || typeof value !== "object" || Array.isArray(value)) return NextResponse.json({ error: "Valeur attendue" }, { status: 400 })
    const current = ((await prisma.appSetting.findUnique({ where: { key } }))?.value ?? {}) as Obj
    const merged: Obj = { ...value }
    for (const [k, v] of Object.entries(merged)) if (v === MASK) merged[k] = current[k] ?? ""
    const s = await prisma.appSetting.upsert({ where: { key }, create: { key, value: merged as object }, update: { value: merged as object } })
    return NextResponse.json({ value: mask(s.value as Obj), updatedAt: s.updatedAt })
  } catch (e) { return errorResponse(e) }
}
