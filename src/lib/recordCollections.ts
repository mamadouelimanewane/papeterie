/** Collections génériques (table AdminRecord) et permissions associées. */
export const RECORD_COLLECTIONS: Record<string, { view: string; manage: string }> = {
  faqs: { view: "content.view", manage: "content.manage" },
  pages: { view: "content.view", manage: "content.manage" },
  "app-strings": { view: "content.view", manage: "content.manage" },
  "module-strings": { view: "content.view", manage: "content.manage" },
  "payment-options": { view: "content.view", manage: "content.manage" },
  documents: { view: "dashboard.view", manage: "settings.manage" },
  "weight-units": { view: "settings.view", manage: "settings.manage" },
  "service-types": { view: "settings.view", manage: "settings.manage" },
  "membership-plans": { view: "settings.view", manage: "settings.manage" },
  "membership-subscribers": { view: "settings.view", manage: "settings.manage" },
  "email-templates": { view: "settings.view", manage: "settings.manage" },
  "payment-methods": { view: "settings.view", manage: "settings.manage" },
  "cashout-requests": { view: "reports.view", manage: "wallet.manage" },
  "vehicle-types": { view: "drivers.view", manage: "drivers.manage" },
  "marker-styles": { view: "dashboard.view", manage: "settings.manage" },
  "driver-vehicles": { view: "drivers.view", manage: "drivers.manage" },
}

type Row = { id: string; data: unknown; sequence: number; createdAt: Date }

/** Aplati un AdminRecord : champs métier + id/sequence/createdAt. */
export const flatRecord = (r: Row) =>
  ({ ...(r.data as Record<string, unknown>), id: r.id, sequence: r.sequence, createdAt: r.createdAt })

/** Retire les champs techniques avant stockage dans `data`. */
export function stripMeta(o: Record<string, unknown>) {
  const rest = { ...o }
  delete rest.id; delete rest.sequence; delete rest.createdAt
  return rest
}
