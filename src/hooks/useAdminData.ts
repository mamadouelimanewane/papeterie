"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { adminFetch } from "@/lib/adminApi"

export type Row = { id: string; [k: string]: unknown }

/**
 * Liste + CRUD sur une source de l'API admin :
 *  - "crud/<modele>"      -> tables Prisma (pays, zones, codes promo...)
 *  - "records/<collection>" -> stockage générique (FAQ, pages, unités...)
 * `seed` : données de départ insérées une seule fois, si la source est vide.
 */
export function useAdminData<T extends Row = Row>(source: string, seed?: Record<string, unknown>[]) {
  const base = `/api/admin/${source}`
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seedRef = useRef(seed)
  const seededRef = useRef(false)

  const reload = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      let rows = await adminFetch<T[]>(base)
      if (rows.length === 0 && seedRef.current?.length && !seededRef.current) {
        seededRef.current = true
        const r = await adminFetch<{ seeded: number }>(`${base}?seed=1`, { method: "POST", body: seedRef.current }).catch(() => ({ seeded: 0 }))
        if (r.seeded > 0) rows = await adminFetch<T[]>(base)
      }
      setItems(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally { setLoading(false) }
  }, [base])

  useEffect(() => { reload() }, [reload])

  const create = async (data: Record<string, unknown>) => {
    const row = await adminFetch<T>(base, { method: "POST", body: data })
    setItems((l) => [...l, row])
    return row
  }
  const update = async (id: string, data: Record<string, unknown>) => {
    const row = await adminFetch<T>(`${base}/${id}`, { method: "PATCH", body: data })
    setItems((l) => l.map((x) => (x.id === id ? row : x)))
    return row
  }
  const remove = async (id: string) => {
    await adminFetch(`${base}/${id}`, { method: "DELETE" })
    setItems((l) => l.filter((x) => x.id !== id))
  }

  return { items, loading, error, reload, create, update, remove, setItems }
}

/** Formulaire de configuration persistant (table AppSetting). */
export function useSetting<T extends Record<string, unknown>>(key: string, defaults: T) {
  const [value, setValue] = useState<T>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const defaultsRef = useRef(defaults)

  useEffect(() => {
    let alive = true
    adminFetch<{ value: T | null; updatedAt: string | null }>(`/api/admin/settings/${key}`)
      .then((r) => { if (alive) { if (r.value) setValue({ ...defaultsRef.current, ...r.value }); setUpdatedAt(r.updatedAt) } })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [key])

  const set = <K extends keyof T>(k: K, v: T[K]) => setValue((s) => ({ ...s, [k]: v }))
  const save = async (next?: T) => {
    setSaving(true)
    try {
      const r = await adminFetch<{ value: T; updatedAt: string }>(`/api/admin/settings/${key}`, { method: "PUT", body: { value: next ?? value } })
      setValue({ ...defaultsRef.current, ...r.value }); setUpdatedAt(r.updatedAt)
    } finally { setSaving(false) }
  }

  return { value, setValue, set, save, loading, saving, updatedAt }
}

/** Liste de choix pour un <select> (ex. zones de service), chargée depuis l'API admin. */
export function useOptions(source: string, labelKey = "name") {
  const [opts, setOpts] = useState<string[]>([])
  useEffect(() => {
    let alive = true
    adminFetch<Row[]>(`/api/admin/${source}`)
      .then((rows) => { if (alive) setOpts(Array.from(new Set(rows.map((r) => String(r[labelKey] ?? "")).filter(Boolean)))) })
      .catch(() => {})
    return () => { alive = false }
  }, [source, labelKey])
  return opts
}

export type Party = "user" | "driver" | "store"
/** Comptes (clients, livreurs, boutiques) pour les formulaires de portefeuille. */
export async function loadAccounts(party: Party): Promise<{ value: string; label: string }[]> {
  if (party === "user") {
    const r = await adminFetch<{ users: { id: string; name: string; phone?: string | null }[] }>("/api/users?perPage=100")
    return r.users.map((u) => ({ value: u.id, label: `${u.name}${u.phone ? ` (${u.phone})` : ""}` }))
  }
  if (party === "driver") {
    const r = await adminFetch<{ drivers: { id: string; name: string; phone?: string | null }[] }>("/api/drivers?perPage=100")
    return r.drivers.map((d) => ({ value: d.id, label: `${d.name}${d.phone ? ` (${d.phone})` : ""}` }))
  }
  const r = await adminFetch<{ id: string; name: string }[]>("/api/stores")
  return r.map((s) => ({ value: s.id, label: s.name }))
}
