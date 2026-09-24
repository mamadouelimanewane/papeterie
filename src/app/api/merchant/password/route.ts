import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireMerchant, MIN_PASSWORD_LENGTH } from "@/lib/merchantAuth"
import { isResponse, errorResponse } from "@/lib/adminAuth"

/** Changement de mot de passe : { current, next } */
export async function PATCH(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const { current, next } = await req.json()
    if (typeof next !== "string" || next.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` }, { status: 400 })
    }
    const store = await prisma.store.findUnique({ where: { id: auth.storeId }, select: { password: true } })
    if (!store?.password || typeof current !== "string" || !(await bcrypt.compare(current, store.password))) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })
    }
    await prisma.store.update({ where: { id: auth.storeId }, data: { password: await bcrypt.hash(next, 12) } })
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e) }
}
