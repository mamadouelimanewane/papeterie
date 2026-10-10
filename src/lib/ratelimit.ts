/**
 * Limiteur de débit.
 *
 * - Si un Redis REST est configuré (Upstash, ou l'intégration Vercel KV / Upstash qui crée
 *   KV_REST_API_URL + KV_REST_API_TOKEN), les compteurs sont PARTAGÉS entre toutes les instances
 *   serverless : la limite est réellement globale (indispensable contre la force brute).
 * - Sinon, ou si Redis ne répond pas, repli sur un compteur en mémoire propre à l'instance
 *   (best-effort, comme avant). Le site ne tombe jamais à cause du limiteur.
 *
 * Toutes les fonctions sont asynchrones : `if (!(await rateLimit(...)))`.
 */

const REDIS_URL = (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "").replace(/\/+$/, "")
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? ""
const PREFIX = "rl:"

export const sharedRateLimitEnabled = !!(REDIS_URL && REDIS_TOKEN)

// ---------------------------------------------------------------------------
// Repli en mémoire (fenêtre glissante par clé)
// ---------------------------------------------------------------------------
const buckets = new Map<string, number[]>()

function memHits(key: string, windowMs: number, now: number) {
  return (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
}

function memRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = memHits(key, windowMs, now)
  if (hits.length >= max) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k)
  }
  return true
}

function memCount(key: string, windowMs: number): number {
  const hits = memHits(key, windowMs, Date.now())
  buckets.set(key, hits)
  return hits.length
}

function memRecord(key: string, windowMs: number): void {
  const now = Date.now()
  const hits = memHits(key, windowMs, now)
  hits.push(now)
  buckets.set(key, hits)
}

// ---------------------------------------------------------------------------
// Redis REST (fenêtre fixe : INCR + expiration posée au premier coup)
// ---------------------------------------------------------------------------
async function redisPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (!sharedRateLimitEnabled) return null
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const out = (await res.json()) as { result?: unknown; error?: string }[]
    if (!Array.isArray(out) || out.some((r) => r?.error)) throw new Error("réponse Redis invalide")
    return out.map((r) => r.result)
  } catch (e) {
    console.error("[ratelimit] Redis indisponible, repli en mémoire :", e instanceof Error ? e.message : e)
    return null
  }
}

async function redisIncr(key: string, windowMs: number): Promise<number | null> {
  const r = await redisPipeline([
    ["INCR", PREFIX + key],
    ["PEXPIRE", PREFIX + key, windowMs, "NX"],
  ])
  return r ? Number(r[0]) : null
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------
export function clientIp(req: { headers: Headers }): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown"
}

/** Renvoie true si la requête est autorisée, false si la limite est dépassée. */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const n = await redisIncr(key, windowMs)
  if (n !== null) return n <= max
  return memRateLimit(key, max, windowMs)
}

/** Vrai si `max` échecs ont déjà été enregistrés pour cette clé dans la fenêtre (sans en ajouter un). */
export async function tooManyFailures(key: string, max: number, windowMs: number): Promise<boolean> {
  const r = await redisPipeline([["GET", PREFIX + key]])
  if (r) return Number(r[0] ?? 0) >= max
  return memCount(key, windowMs) >= max
}

/** Enregistre un échec (ex. mauvais code de livraison, mauvais code marchand) pour la clé. */
export async function recordFailure(key: string, windowMs: number): Promise<void> {
  const n = await redisIncr(key, windowMs)
  if (n === null) memRecord(key, windowMs)
}
