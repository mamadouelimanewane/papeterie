import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const IMAGES: Record<string, string> = {
  "Cahier 100 pages grands carreaux": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
  "Cahier 200 pages petits carreaux": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400",
  "Livre Mathematiques 3eme": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400",
  "Livre Francais Terminale": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
  "Livre Histoire-Geo 5eme": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
  "Regle 30cm Maped": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
  "Compas metal professionnel": "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400",
  "Stylo bille bleu BIC x10": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
  "Crayons de couleur 24 pieces": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400",
  "Cahier de brouillon A4": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
  "Cahier Seyes 96 pages": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
  "Livre Physique-Chimie 2nde": "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400",
  "Livre SVT 4eme": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400",
  "Equerre 45-60 Maped": "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400",
  "Rapporteur 180 transparent": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
  "Marqueurs fluo x5": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
  "Colle en stick UHU 40g": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  "Peinture acrylique 12 couleurs": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
  "Cahier grands carreaux 48 pages": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
  "Livre Anglais 6eme": "https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=400",
  "Livre Geographie CM2": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
  "Trousse scolaire 10 pieces": "https://images.unsplash.com/photo-1588072432836-e10032774350?w=400",
  "Gomme blanche Staedtler": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  "Taille-crayon double trou": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
  "Feutres de coloriage x24": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400",
  "Carnet de dessin A4 40 pages": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
}

export async function POST(req: Request) {
  try {
    const { key } = await req.json()
    if (key !== (process.env.SEED_SECRET ?? "papeterie-seed-2024")) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    let updated = 0
    for (const [name, image] of Object.entries(IMAGES)) {
      const r = await prisma.product.updateMany({ where: { name }, data: { image } })
      updated += r.count
    }
    return NextResponse.json({ success: true, updated })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}