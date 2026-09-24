"use client"

/** Appel JSON vers l'API admin : lève une Error avec le message serveur en cas d'échec. */
export async function adminFetch<T = unknown>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })
  let data: unknown = null
  try { data = await res.json() } catch { /* réponse vide */ }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error
    throw new Error(msg || (res.status === 401 ? "Session expirée, reconnectez-vous" : res.status === 403 ? "Accès non autorisé" : `Erreur ${res.status}`))
  }
  return data as T
}

/** Export CSV (séparateur « ; » + BOM UTF-8 : s'ouvre directement dans Excel en français). */
export function exportCsv(filename: string, columns: { key: string; label: string }[], rows: Record<string, unknown>[]) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v)
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [columns.map((c) => esc(c.label)).join(";"), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(";"))]
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const fmtMoney = (n: unknown) => `${Number(n ?? 0).toLocaleString("fr-FR")} FCFA`
export const fmtDate = (d: unknown) => (d ? new Date(String(d)).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—")
