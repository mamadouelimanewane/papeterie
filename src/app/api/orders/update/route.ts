import { NextRequest, NextResponse } from "next/server"
import { PATCH } from "../[id]/route"

/**
 * Alias historique : PUT { id, ...champs } -> PATCH /api/orders/:id.
 * Passe par la meme route que le back-office et les livreurs : permissions,
 * champs autorises, codes de ramassage/livraison, credit du livreur et remise en stock.
 */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const id = body && typeof body.id === "string" ? body.id : null
  if (!id) return NextResponse.json({ error: "Identifiant de commande requis" }, { status: 400 })
  const data = { ...body }
  delete data.id
  const forwarded = new NextRequest(req.url, { method: "PATCH", headers: req.headers, body: JSON.stringify(data) })
  return PATCH(forwarded, { params: Promise.resolve({ id }) })
}
