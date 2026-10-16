import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { aiSearch, aiSearchEnabled } from "@/lib/aiSearch"

/**
 * Recherche intelligente de la vitrine (publique) : POST { q } -> { message, productIds }.
 * Limitée en débit (appel à un service d'IA payant à l'usage).
 */
export async function POST(req: Request) {
  if (!aiSearchEnabled()) return NextResponse.json({ error: "Assistant indisponible" }, { status: 503 })
  if (!await rateLimit("shop-ai-search:" + clientIp(req), 12, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de questions, réessayez dans quelques minutes" }, { status: 429 })
  }
  const { q } = await req.json().catch(() => ({}))
  const question = typeof q === "string" ? q.trim().replace(/\s+/g, " ") : ""
  if (question.length < 2 || question.length > 200) {
    return NextResponse.json({ error: "Question entre 2 et 200 caractères" }, { status: 400 })
  }
  try {
    return NextResponse.json(await aiSearch(question))
  } catch (e) {
    console.error("[shop/ai-search]", e)
    return NextResponse.json({ error: "L'assistant ne répond pas, réessayez" }, { status: 502 })
  }
}
