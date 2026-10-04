// Permissions RBAC centralisees

export const ALL_PERMISSIONS = [
  "dashboard.view",
  "orders.view", "orders.manage",
  "users.view", "users.manage",
  "drivers.view", "drivers.manage", "drivers.approve",
  "stores.view", "stores.manage",
  "reports.view", "reports.export",
  "settings.view", "settings.manage",
  "content.view", "content.manage",
  "notifications.send",
  "wallet.view", "wallet.manage",
]

// Roles consideres comme super-administrateurs (acces total)
export const SUPER_ROLES = ["Super Admin", "Super Administrateur", "Admin", "admin"]

// Prefixe de route -> permission requise (le premier match gagne)
const ROUTE_PERMS: [string, string][] = [
  ["/dashboard", "dashboard.view"],
  ["/orders", "orders.view"],
  ["/invoices", "orders.view"],
  ["/users", "users.view"],
  ["/drivers", "drivers.view"],
  ["/vehicles", "drivers.view"],
  ["/stores", "stores.view"],
  ["/categories", "stores.view"],
  ["/slider", "stores.view"],
  ["/reports", "reports.view"],
  ["/cashout", "reports.view"],
  ["/wallet", "wallet.view"],
  ["/notifications", "notifications.send"],
  ["/content", "content.view"],
  ["/settings", "settings.view"],
  ["/sub-admin", "settings.view"],
  ["/countries", "settings.view"],
  ["/service-areas", "settings.view"],
  ["/promo-code", "settings.view"],
  ["/service-time-slots", "settings.view"],
  ["/map", "dashboard.view"],
  ["/documents", "dashboard.view"],
  ["/price-card", "settings.view"],
]

export function permForPath(pathname: string): string | null {
  for (const [prefix, perm] of ROUTE_PERMS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return perm
  }
  return null
}

export function hasPerm(perms: string[] | undefined | null, perm: string | null): boolean {
  if (!perm) return true
  if (!perms) return false
  return perms.includes("*") || perms.includes(perm)
}

// Prefixe d'API -> [permission lecture, permission ecriture] (le premier match gagne).
// /api/admin/* verifie sa permission dans chaque route (requireAdmin) : absent d'ici.
const API_PERMS: [string, string, string][] = [
  ["/api/orders", "orders.view", "orders.manage"],
  ["/api/users", "users.view", "users.manage"],
  ["/api/drivers", "drivers.view", "drivers.manage"],
  ["/api/stores", "stores.view", "stores.manage"],
  ["/api/store", "stores.view", "stores.manage"],
  ["/api/categories", "stores.view", "stores.manage"],
  ["/api/slider", "stores.view", "stores.manage"],
  ["/api/kits", "stores.view", "stores.manage"],
  ["/api/transactions", "reports.view", "reports.view"],
  ["/api/dashboard", "dashboard.view", "dashboard.view"],
  ["/api/notifications", "notifications.send", "notifications.send"],
  ["/api/promo-codes", "settings.view", "settings.manage"],
  ["/api/service-areas", "settings.view", "settings.manage"],
  ["/api/countries", "settings.view", "settings.manage"],
]

export function permForApi(pathname: string, method: string): string | null {
  for (const [prefix, read, write] of API_PERMS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return method === "GET" || method === "HEAD" ? read : write
    }
  }
  return null
}
