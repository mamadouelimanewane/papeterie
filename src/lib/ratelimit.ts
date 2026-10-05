/**
 * Limiteur de debit en memoire (fenetre glissante par cle).
 * Best-effort : l'etat est propre a chaque instance serverless. Pour une garantie
 * globale, brancher un stockage partage (Upstash/Redis) derriere la meme API.
 */
const buckets = new Map<string, number[]>()

export function clientIp(req: { headers: Headers }): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown"
}

/** Renvoie true si la requete est autorisee, false si la limite est depassee. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
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

/** Vrai si `max` échecs ont déjà été enregistrés pour cette clé dans la fenêtre (sans en ajouter un). */
export function tooManyFailures(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  buckets.set(key, hits)
  return hits.length >= max
}

/** Enregistre un échec (ex. mauvais code de livraison) pour la clé. */
export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  hits.push(now)
  buckets.set(key, hits)
}
