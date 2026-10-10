import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isResponse, requireAdminApi, errorResponse } from "@/lib/adminAuth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id }, omit: { password: true } })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/users/[id]]")
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const data = await req.json()
    const allowed = ["name", "phone", "email", "country", "status", "userType", "walletMoney"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }
    const user = await prisma.user.update({ where: { id }, data: update, omit: { password: true } })
    return NextResponse.json(user)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/users/[id]]")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/users/[id]]")
  }
}
