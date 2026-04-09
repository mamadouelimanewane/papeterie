import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, vehicleType, serviceArea } = await req.json()

    if (!name || !password || (!email && !phone)) {
      return NextResponse.json(
        { error: "Nom, mot de passe et email/téléphone sont requis" },
        { status: 400 }
      )
    }

    // Vérifier si le driver existe déjà
    const existing = await prisma.driver.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet email ou téléphone existe déjà" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const driver = await prisma.driver.create({
      data: {
        name,
        email: email ?? `${phone}@papeterie.sn`,
        phone: phone ?? null,
        password: hashedPassword,
        vehicleType: vehicleType ?? null,
        serviceArea: serviceArea ?? null,
        approvalStatus: "Pending",
        status: "Offline",
      },
    })

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
        approvalStatus: driver.approvalStatus,
        status: driver.status,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("[driver-register]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
