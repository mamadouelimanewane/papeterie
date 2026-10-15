import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { parsePoint } from "@/lib/deliveryPricing"

type Hit = { label: string; lat: number; lng: number }
const cache = new Map<string, { at: number; hits: Hit[] }>()
const TTL_MS = 10 * 60_000

/**
 * Recherche d'adresse (Sénégal) -> positions GPS : { q } -> { results: [{ label, lat, lng }] }.
 * Utilise LocationIQ si une clé est définie (LOCATIONIQ_KEY ou NEXT_PUBLIC_LOCATIONIQ_KEY), sinon OpenStreetMap Nominatim
 * (usage modéré : 1 requête/s maximum selon leurs conditions — d'où la limitation et le cache ci-dessous).
 */
export async function POST(req: Request) {
  if (!await rateLimit("geocode:" + clientIp(req), 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de recherches, reessayez dans quelques minutes" }, { status: 429, headers: { "Retry-After": "600" } })
  }
  const { q } = await req.json().catch(() => ({ q: "" }))
  const query = String(q ?? "").trim().slice(0, 120)
  if (query.length < 3) return NextResponse.json({ error: "Saisissez au moins 3 caractères" }, { status: 400 })

  const key = query.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return NextResponse.json({ results: hit.hits })

  const liqKey = process.env.LOCATIONIQ_KEY || process.env.NEXT_PUBLIC_LOCATIONIQ_KEY
  const url = liqKey
    ? `https://us1.locationiq.com/v1/search?key=${encodeURIComponent(liqKey)}&q=${encodeURIComponent(query + ", Dakar")}&format=json&countrycodes=sn&limit=5`
    : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Dakar")}&format=json&countrycodes=sn&limit=5`
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Schoolmatik/1.0 (contact@schoolmatik.sn)", Accept: "application/json" }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return NextResponse.json({ error: "Service de recherche d'adresse indisponible" }, { status: 502 })
    const raw = (await res.json()) as { lat: string; lon: string; display_name: string }[]
    const hits: Hit[] = []
    for (const r of Array.isArray(raw) ? raw : []) {
      const p = parsePoint(r.lat, r.lon)
      if (p) hits.push({ label: String(r.display_name).slice(0, 160), lat: p.lat, lng: p.lng })
    }
    cache.set(key, { at: Date.now(), hits })
    if (cache.size > 500) cache.clear()
    return NextResponse.json({ results: hits })
  } catch {
    return NextResponse.json({ error: "Service de recherche d'adresse indisponible" }, { status: 502 })
  }
}
