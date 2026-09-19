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
