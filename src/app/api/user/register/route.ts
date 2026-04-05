import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

export async function POST(req: Request) {
  try {
    const { name, phone, email, password } = await req.json()

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Nom, téléphone et mot de passe sont requis" },
        { status: 400 }
      )
    }

    // Check si le téléphone ou email existe déjà
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { phone },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec ce téléphone ou cet email" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const last = await prisma.user.findFirst({ orderBy: { userId: "desc" } })
    const userId = (last?.userId ?? 0) + 1

    const user = await prisma.user.create({
      data: {
        userId,
        name,
        email: email ?? `${phone}@papeterie.sn`,
        phone,
        password: hashedPassword,
        status: "Active",
        userType: "Retail",
        signupType: "App/Admin",
        signupFrom: "Application",
      },
    })

    const token = sign(
      { id: user.id, userId: user.userId, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    )

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          walletBalance: user.walletMoney,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[register]", error)
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
