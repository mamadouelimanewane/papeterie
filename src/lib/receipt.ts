import { prisma } from "@/lib/prisma"
import { getSetting } from "@/lib/appSettings"
import { PAID_STATUSES, customerFromNotes } from "@/lib/orderPayment"
export { isValidReceiptToken, receiptToken } from "@/lib/receiptToken"

// ---------------------------------------------------------------------------
// Montant en toutes lettres (francs CFA, nombres entiers)
// ---------------------------------------------------------------------------

const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"]

/** 0 à 99 (orthographe traditionnelle : « vingt et un », « soixante-dix-sept », « quatre-vingts »). */
function below100(n: number): string {
  if (n < 20) return UNITS[n]
  const t = Math.floor(n / 10)
  const u = n % 10
  if (t === 7 || t === 9) {
    // 70-79 = soixante-dix…, 90-99 = quatre-vingt-dix…
    const base = t === 7 ? "soixante" : "quatre-vingt"
    const rest = 10 + u
    return t === 7 && rest === 11 ? "soixante et onze" : base + "-" + UNITS[rest]
  }
  if (t === 8) return u === 0 ? "quatre-vingts" : "quatre-vingt-" + UNITS[u]
  if (u === 0) return TENS[t]
  if (u === 1) return TENS[t] + " et un"
  return TENS[t] + "-" + UNITS[u]
}

/** 0 à 999. `final` : le groupe n'est pas suivi de « mille » (accord de « cents » et « quatre-vingts »). */
function below1000(n: number, final: boolean): string {
  const h = Math.floor(n / 100)
  const r = n % 100
  const words: string[] = []
  if (h > 0) words.push(h === 1 ? "cent" : UNITS[h] + (r === 0 && final ? " cents" : " cent"))
  if (r > 0) words.push(!final && r === 80 ? "quatre-vingt" : below100(r))
  return words.join(" ")
}

/** Écrit un entier positif en lettres. Ex. 12 580 → « douze mille cinq cent quatre-vingts ». */
export function numberToFrenchWords(value: number): string {
  let n = Math.round(Math.abs(value))
  if (n === 0) return "zéro"
  const parts: string[] = []
  const scales: [number, string, string][] = [
    [1_000_000_000, "milliard", "milliards"],
    [1_000_000, "million", "millions"],
  ]
  for (const [size, one, many] of scales) {
    const q = Math.floor(n / size)
    if (q > 0) {
      parts.push(below1000(q, true) + " " + (q > 1 ? many : one))
      n %= size
    }
  }
  const thousands = Math.floor(n / 1000)
  if (thousands > 0) {
    parts.push(thousands === 1 ? "mille" : below1000(thousands, false) + " mille")
    n %= 1000
  }
  if (n > 0) parts.push(below1000(n, true))
  return parts.join(" ")
}

// ---------------------------------------------------------------------------
// Données du reçu
// ---------------------------------------------------------------------------

export type ReceiptLine = { name: string; quantity: number; unitPrice: number; total: number; details?: string }

export type ReceiptData = {
  seller: {
    name: string
    legalName: string | null
    address: string | null
    phone: string | null
    email: string | null
    ninea: string | null
    rccm: string | null
    logo: string | null
  }
  receiptNo: string
  orderId: string
  orderedAt: string
  paidAt: string
  payment: { method: string; reference: string | null }
  customer: { name: string | null; phone: string | null; address: string | null }
  lines: ReceiptLine[]
  subtotal: number
  discount: number
  promoCode: string | null
  deliveryFee: number
  total: number
  totalInWords: string
  currency: string
  footer: string | null
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

/** « 771234567 » → « 77 ••• •• 67 » : le reçu peut être transféré, le numéro complet n'y figure pas. */
export function maskPhone(phone: string | null | undefined): string | null {
  const d = String(phone ?? "").replace(/\D/g, "").slice(-9)
  if (d.length < 9) return null
  return `${d.slice(0, 2)} ••• •• ${d.slice(7)}`
}

const METHOD_LABEL: Record<string, string> = {
  Versus: "Paiement mobile (Wave, Orange Money)",
  Wave: "Wave",
  Orange: "Orange Money",
  "Orange Money": "Orange Money",
  Cash: "Espèces",
}

/** Numéro de reçu lisible et stable, dérivé du numéro de commande : ORD-1760100000000-42 → REC-1760100000000-42. */
export function receiptNumber(orderId: string): string {
  return orderId.replace(/^ORD-/, "REC-")
}

type RawItem = { name?: unknown; price?: unknown; quantity?: unknown; qty?: unknown; components?: unknown }

/**
 * Construit le reçu d'une commande PAYÉE. Renvoie null si la commande n'existe pas ou n'est pas payée
 * (on ne délivre pas de reçu pour une commande non réglée).
 */
export async function buildReceipt(orderId: string): Promise<ReceiptData | null> {
  const order = await prisma.order.findUnique({
    where: { orderId },
    select: {
      id: true, orderId: true, createdAt: true, updatedAt: true, items: true, subtotal: true, deliveryFee: true,
      total: true, paymentMethod: true, paymentStatus: true, invoiceId: true, address: true, notes: true, userId: true,
      store: { select: { name: true, address: true, phone: true, email: true } },
    },
  })
  if (!order || !PAID_STATUSES.includes(order.paymentStatus)) return null

  const [general, payment, user] = await Promise.all([
    getSetting("general"),
    // Transaction créée par le webhook Versus, retrouvée par la référence de l'opérateur
    order.invoiceId && !order.invoiceId.startsWith("INV-")
      ? prisma.transaction.findFirst({
          where: { receiptNo: order.invoiceId, type: "Paiement Commande" },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        })
      : null,
    order.userId ? prisma.user.findUnique({ where: { id: order.userId }, select: { name: true, phone: true } }) : null,
  ])

  const lines: ReceiptLine[] = (Array.isArray(order.items) ? (order.items as RawItem[]) : []).map((i) => {
    const quantity = Math.max(1, Number(i.quantity ?? i.qty ?? 1) || 1)
    const unitPrice = Number(i.price) || 0
    const comps = Array.isArray(i.components) ? (i.components as { name?: unknown; qty?: unknown }[]) : []
    const details = comps.length
      ? comps.map((c) => `${Number(c.qty) > 1 ? `${Number(c.qty)} × ` : ""}${String(c.name ?? "")}`).join(", ")
      : undefined
    return { name: String(i.name ?? "Article"), quantity, unitPrice, total: unitPrice * quantity, details }
  })

  const subtotal = order.subtotal || lines.reduce((s, l) => s + l.total, 0)
  const discount = Math.max(0, Math.round(subtotal + order.deliveryFee - order.total))
  const fromNotes = customerFromNotes(order.notes)
  const notesName = order.notes?.match(/Client:\s*([^|]+)/)?.[1]?.trim() || null
  const promoCode = order.notes?.match(/\[Promo:\s*([^\]]+)\]/)?.[1]?.trim() ?? null
  const currency = str(general.currency) ?? "FCFA"

  return {
    seller: {
      name: str(general.storeName) ?? order.store?.name ?? "Schoolmatik Librairie",
      legalName: str(general.legalName),
      address: str(general.legalAddress) ?? order.store?.address ?? null,
      phone: str(general.legalPhone) ?? order.store?.phone ?? null,
      email: str(general.reportEmail) ?? order.store?.email ?? null,
      ninea: str(general.ninea),
      rccm: str(general.rccm),
      logo: str(general.logo),
    },
    receiptNo: receiptNumber(order.orderId),
    orderId: order.orderId,
    orderedAt: order.createdAt.toISOString(),
    // Date du paiement : enregistrement de la transaction, à défaut dernière mise à jour de la commande
    paidAt: (payment?.createdAt ?? order.updatedAt).toISOString(),
    payment: {
      method: METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod,
      // Le webhook enregistre la référence de l'opérateur dans invoiceId ; « INV-… » est notre numéro interne
      reference: order.invoiceId && !order.invoiceId.startsWith("INV-") ? order.invoiceId : null,
    },
    customer: {
      name: notesName ?? user?.name ?? null,
      phone: maskPhone(fromNotes.phone || user?.phone),
      address: order.address,
    },
    lines,
    subtotal,
    discount,
    promoCode,
    deliveryFee: order.deliveryFee,
    total: order.total,
    totalInWords: numberToFrenchWords(order.total),
    currency,
    footer: str(general.receiptFooter) ?? "Merci pour votre confiance !",
  }
}
