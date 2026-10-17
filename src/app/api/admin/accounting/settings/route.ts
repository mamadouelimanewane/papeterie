import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resetSettingsCache } from "@/lib/appSettings"
import { accAuth, accError } from "@/lib/accounting/api"
import { getAccountingConfig } from "@/lib/accounting/config"
import { AccountingError } from "@/lib/accounting/ledger"
import { audit } from "@/lib/security/audit"

export const runtime = "nodejs"

/** Réglages comptables + catégories du catalogue (avec le nombre de produits ayant un taux propre). */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    const cfg = await getAccountingConfig()
    const cats = await prisma.product.groupBy({ by: ["category"], _count: { _all: true } })
    const own = await prisma.product.groupBy({ by: ["category"], where: { vatRate: { not: null } }, _count: { _all: true } })
    return NextResponse.json({
      config: cfg,
      categories: cats.filter((c) => c.category).map((c) => ({ name: c.category!, products: c._count._all, ownRate: own.find((o) => o.category === c.category)?._count._all ?? 0 })).sort((a, b) => b.products - a.products),
    })
  } catch (e) { return accError(e) }
}

const rate = (v: unknown, what: string) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new AccountingError(`Taux de TVA invalide : ${what}`)
  return n
}

export async function PUT(req: NextRequest) {
  const { res, who } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    const categoryRates: Record<string, number> = {}
    for (const [k, v] of Object.entries((b.categoryRates ?? {}) as Record<string, unknown>)) {
      if (v === "" || v === null || v === undefined) continue // vide : taux par défaut
      categoryRates[k.slice(0, 80)] = rate(v, k)
    }
    if (b.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(b.startDate))) throw new AccountingError("Date de début invalide")
    const c = (b.company ?? {}) as Record<string, unknown>
    const value = {
      vatDefault: rate(b.vatDefault ?? 18, "taux par défaut"),
      deliveryVatRate: rate(b.deliveryVatRate ?? 18, "livraison"),
      categoryRates,
      mode: b.mode === "commission" ? "commission" : "single",
      startDate: String(b.startDate || "2026-01-01"),
      company: Object.fromEntries(["name", "ninea", "rccm", "address", "city"].map((k) => [k, String(c[k] ?? "").slice(0, 120)])),
    }
    await prisma.appSetting.upsert({ where: { key: "accounting" }, update: { value }, create: { key: "accounting", value } })
    resetSettingsCache("accounting")
    await audit(req, { email: who }, "accounting.settings", null, { tvaDéfaut: value.vatDefault, livraison: value.deliveryVatRate, catégories: value.categoryRates, mode: value.mode })
    return NextResponse.json(value)
  } catch (e) { return accError(e) }
}
