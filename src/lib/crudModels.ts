/**
 * Tables Prisma exposées par l'API générique /api/admin/crud/[model].
 * Seuls les champs listés ici sont modifiables (liste blanche), avec conversion de type.
 */
export type FieldType = "string" | "number" | "int" | "date" | "json"

export type CrudModel = {
  delegate: string // nom du délégué Prisma (prisma[delegate])
  fields: Record<string, FieldType>
  required?: string[]
  view: string // permission lecture
  manage: string // permission écriture
  orderBy?: Record<string, "asc" | "desc">
  include?: Record<string, unknown>
  readOnly?: boolean
}

export const CRUD_MODELS: Record<string, CrudModel> = {
  countries: {
    delegate: "country", view: "settings.view", manage: "settings.manage",
    fields: { name: "string", code: "string", flag: "string", phoneCode: "string", currency: "string", currencySymbol: "string", status: "string" },
    required: ["name", "code"], orderBy: { name: "asc" },
  },
  "service-areas": {
    delegate: "serviceArea", view: "settings.view", manage: "settings.manage",
    fields: { name: "string", country: "string", lat: "number", lng: "number", radiusKm: "number", deliveryFee: "number", status: "string" },
    required: ["name", "country"], orderBy: { name: "asc" },
  },
  vehicles: {
    delegate: "vehicle", view: "drivers.view", manage: "drivers.manage",
    fields: { name: "string", image: "string", status: "string" },
    required: ["name"], orderBy: { createdAt: "asc" },
  },
  slider: {
    delegate: "sliderBanner", view: "stores.view", manage: "stores.manage",
    fields: { title: "string", image: "string", link: "string", sequence: "int", status: "string" },
    required: ["image"], orderBy: { sequence: "asc" },
  },
  notifications: {
    delegate: "notification", view: "notifications.send", manage: "notifications.send",
    fields: { title: "string", message: "string", target: "string", imageUrl: "string", status: "string", sentAt: "date" },
    required: ["title", "message"], orderBy: { createdAt: "desc" },
  },
  "fare-rules": {
    delegate: "fareRule", view: "settings.view", manage: "settings.manage",
    fields: { name: "string", baseFare: "number", perKm: "number", minFare: "number", serviceArea: "string", vehicleType: "string", status: "string" },
    required: ["name"], orderBy: { createdAt: "asc" },
  },
  surge: {
    delegate: "surgePricing", view: "settings.view", manage: "settings.manage",
    fields: { name: "string", multiplier: "number", startTime: "string", endTime: "string", daysOfWeek: "json", serviceArea: "string", status: "string" },
    required: ["name", "startTime", "endTime"], orderBy: { createdAt: "asc" },
  },
  "time-slots": {
    delegate: "serviceTimeSlot", view: "settings.view", manage: "settings.manage",
    fields: { label: "string", startTime: "string", endTime: "string", daysOfWeek: "json", maxOrders: "int", status: "string" },
    required: ["label", "startTime", "endTime"], orderBy: { startTime: "asc" },
  },
  "cancel-reasons": {
    delegate: "cancelReason", view: "settings.view", manage: "settings.manage",
    fields: { reason: "string", userType: "string", status: "string" },
    required: ["reason"], orderBy: { createdAt: "asc" },
  },
  "map-markers": {
    delegate: "mapMarker", view: "dashboard.view", manage: "settings.manage",
    fields: { label: "string", lat: "number", lng: "number", type: "string", description: "string", status: "string" },
    required: ["label", "lat", "lng"], orderBy: { createdAt: "asc" },
  },
  "promo-codes": {
    delegate: "promoCode", view: "settings.view", manage: "settings.manage",
    fields: { code: "string", discount: "number", type: "string", maxUses: "int", expiresAt: "date", status: "string" },
    required: ["code", "discount"], orderBy: { createdAt: "desc" },
  },
  "driver-documents": {
    delegate: "driverDocument", view: "drivers.view", manage: "drivers.approve",
    fields: { driverId: "string", type: "string", label: "string", fileUrl: "string", expiresAt: "date", status: "string" },
    required: ["driverId", "type", "label"], orderBy: { createdAt: "desc" },
    include: { driver: { select: { name: true, phone: true } } },
  },
  transactions: {
    delegate: "transaction", view: "reports.view", manage: "wallet.manage",
    fields: { userId: "string", driverId: "string", storeId: "string", amount: "number", type: "string", method: "string", description: "string", receiptNo: "string", status: "string" },
    required: ["amount", "type"], orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } }, driver: { select: { name: true } } },
  },
}

/** Convertit et filtre un corps de requête selon la liste blanche du modèle. */
export function coerce(model: CrudModel, body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, unknown> = {}
  for (const [key, type] of Object.entries(model.fields)) {
    if (!(key in body)) continue
    const v = body[key]
    // Vide : en création on laisse la valeur par défaut de la base, en modification on efface.
    if (v === "" || v === null || v === undefined) { if (partial) out[key] = null; continue }
    switch (type) {
      case "number": { const n = Number(v); if (Number.isNaN(n)) throw new Error(`Champ ${key} : nombre attendu`); out[key] = n; break }
      case "int": { const n = parseInt(String(v), 10); if (Number.isNaN(n)) throw new Error(`Champ ${key} : entier attendu`); out[key] = n; break }
      case "date": { const d = new Date(String(v)); if (Number.isNaN(d.getTime())) throw new Error(`Champ ${key} : date invalide`); out[key] = d; break }
      case "json": out[key] = typeof v === "string" ? JSON.parse(v) : v; break
      default: out[key] = String(v).trim()
    }
  }
  if (!partial) {
    for (const r of model.required ?? []) {
      if (out[r] === undefined || out[r] === null) throw new Error(`Champ obligatoire manquant : ${r}`)
    }
  }
  return out
}
