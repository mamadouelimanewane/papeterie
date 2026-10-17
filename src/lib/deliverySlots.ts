import { prisma } from "@/lib/prisma"

/**
 * Créneaux de livraison proposés au panier (Paramètres › Créneaux de livraison).
 * Une option = un créneau actif × une date des prochains jours (heure de Dakar = UTC).
 * Le créneau choisi est conservé dans les notes de la commande : « [Créneau: mer. 21/10 · Matin (08:00–12:00)] ».
 */

const DAYS_AHEAD = 4 // aujourd'hui + 3 jours
const MIN_LEAD_MS = 60 * 60_000 // un créneau du jour n'est plus proposé moins d'1 h avant son début
const DAY_NAMES = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."]
const CANCELLED = ["Cancelled", "Annule"]

export type SlotOption = { value: string; label: string; full: boolean }
type Slot = { id: string; label: string; startTime: string; endTime: string; daysOfWeek: unknown; maxOrders: number | null }

const ymd = (d: Date) => d.toISOString().slice(0, 10)
const pad = (n: number) => String(n).padStart(2, "0")

function labelFor(slot: Slot, day: Date) {
  return `${DAY_NAMES[day.getUTCDay()]} ${pad(day.getUTCDate())}/${pad(day.getUTCMonth() + 1)} · ${slot.label} (${slot.startTime}–${slot.endTime})`
}

/** Début du créneau ce jour-là (UTC = heure de Dakar). */
function startOf(slot: Slot, day: Date) {
  const [h, m] = slot.startTime.split(":").map(Number)
  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h || 0, m || 0)
}

const allowedDay = (slot: Slot, day: Date) => {
  const days = Array.isArray(slot.daysOfWeek) ? (slot.daysOfWeek as number[]) : []
  return days.includes(day.getUTCDay())
}

/** Nombre de commandes non annulées déjà prises sur ce créneau. */
async function booked(label: string) {
  return prisma.order.count({ where: { notes: { contains: `[Créneau: ${label}]` }, status: { notIn: CANCELLED } } })
}

/** Options proposées au client (créneaux complets signalés, pas masqués). */
export async function listSlotOptions(now = new Date()): Promise<SlotOption[]> {
  const slots = await prisma.serviceTimeSlot.findMany({ where: { status: "Active" }, orderBy: { startTime: "asc" } })
  const out: SlotOption[] = []
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i))
    for (const s of slots) {
      if (!allowedDay(s, day) || startOf(s, day) < now.getTime() + MIN_LEAD_MS) continue
      const label = labelFor(s, day)
      const full = !!s.maxOrders && (await booked(label)) >= s.maxOrders
      out.push({ value: `${s.id}|${ymd(day)}`, label, full })
    }
  }
  return out
}

/** Vérifie le créneau choisi (« idCreneau|AAAA-MM-JJ ») et renvoie l'étiquette à enregistrer. */
export async function resolveSlot(value: unknown, now = new Date()): Promise<{ ok: true; label: string } | { ok: false; error: string }> {
  const m = typeof value === "string" ? value.match(/^([\w-]{1,40})\|(\d{4}-\d{2}-\d{2})$/) : null
  if (!m) return { ok: false, error: "Créneau de livraison invalide" }
  const slot = await prisma.serviceTimeSlot.findFirst({ where: { id: m[1], status: "Active" } })
  const day = new Date(`${m[2]}T00:00:00Z`)
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  if (!slot || isNaN(day.getTime()) || day.getTime() < today || day.getTime() >= today + DAYS_AHEAD * 86_400_000 || !allowedDay(slot, day)) {
    return { ok: false, error: "Ce créneau de livraison n'est pas disponible" }
  }
  if (startOf(slot, day) < now.getTime() + MIN_LEAD_MS) return { ok: false, error: "Ce créneau est déjà passé : choisissez-en un autre" }
  const label = labelFor(slot, day)
  if (slot.maxOrders && (await booked(label)) >= slot.maxOrders) return { ok: false, error: "Ce créneau est complet : choisissez-en un autre" }
  return { ok: true, label }
}
