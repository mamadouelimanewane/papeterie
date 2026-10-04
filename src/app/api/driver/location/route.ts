import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertSessionActive } from "@/lib/mobileSession"
import { verify } from "jsonwebtoken"

const JWT_SECRET = (process.env.NEXTAUTH_SECRET as string)

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verify(token, JWT_SECRET) as { id: string }
    await assertSessionActive("driver", decoded)

    const { lat, lng } = await req.json()
    const lastLocation = `${lat},${lng}`

    const driver = await prisma.driver.update({
      where: { id: decoded.id },
      data: { lastLocation }
    })

    return NextResponse.json({ success: true, lastLocation: driver.lastLocation })
  } catch (error) {
    console.error("[driver-location-put]", error)
    return NextResponse.json({ error: "Erreur serveur ou token invalide" }, { status: 500 })
  }
}
