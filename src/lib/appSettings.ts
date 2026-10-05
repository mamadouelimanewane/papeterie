import { prisma } from "@/lib/prisma"

const TTL_MS = 30_000
const cache = new Map<string, { at: number; value: Record<string, unknown> }>()

/** Réglage de l'application (table AppSetting), avec un cache de 30 s par instance. */
export async function getSetting(key: string): Promise<Record<string, unknown>> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value
  let value: Record<string, unknown> = {}
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } })
    if (row?.value && typeof row.value === "object" && !Array.isArray(row.value)) value = row.value as Record<string, unknown>
  } catch { /* réglage illisible : valeurs par défaut */ }
  cache.set(key, { at: Date.now(), value })
  return value
}

/** Efface le cache (appelé quand l'administrateur enregistre un réglage). */
export function resetSettingsCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}
