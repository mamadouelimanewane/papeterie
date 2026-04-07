import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

export async function POST(req: Request) {
  try {
    const { email, phone, password } = await req.json()

    if ((!email && !phone) || !password) {
      return NextResponse.json(
        { error: "Email/Téléphone et mot de passe sont requis" },
        { status: 400 }
      )
    }

    const driver = await prisma.driver.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    })

    if (!driver || !driver.password) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }

    const isMatch = await bcrypt.compare(password, driver.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }

    const token = sign(
      { id: driver.id, driverId: driver.driverId, name: driver.name, email: driver.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    )

    return NextResponse.json({
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
      }
    })
  } catch (error) {
    console.error("[driver-login]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
