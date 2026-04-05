import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const countries = await prisma.country.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json(countries)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.name || !data.code) {
      return NextResponse.json({ error: "name et code sont requis" }, { status: 400 })
    }
    const country = await prisma.country.create({
      data: { name: data.name, code: data.code.toUpperCase(), flag: data.flag ?? null, status: data.status ?? "Active" },
    })
    return NextResponse.json(country, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
