import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/** Photo de produit (publique : affichée par la vitrine). L'URL change à chaque nouvelle photo, donc cache long. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-z0-9]{10,40}$/.test(id)) return new NextResponse("Not found", { status: 404 })
  const etag = `"${id}"`
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" } })
  }
  const img = await prisma.productImage.findUnique({ where: { id }, select: { mime: true, data: true } })
  if (!img) return new NextResponse("Not found", { status: 404 })
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
