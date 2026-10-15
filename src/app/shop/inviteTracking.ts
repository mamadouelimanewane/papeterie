/** Code de l'invitation personnelle ouverte sur cet appareil (lien /i/<code>). */
export const INVITE_KEY = "schoolmatik_invite"

/** Signale l'installation de l'application pour l'invitation de cet appareil (une seule fois). */
export function reportInstalled() {
  try {
    const code = localStorage.getItem(INVITE_KEY)
    if (!code || localStorage.getItem(INVITE_KEY + "_installed")) return
    localStorage.setItem(INVITE_KEY + "_installed", "1")
    fetch("/api/shop/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, event: "installed" }) }).catch(() => {})
  } catch { /* stockage indisponible */ }
}
