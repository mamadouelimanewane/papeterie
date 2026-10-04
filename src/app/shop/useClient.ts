"use client"

import { useEffect, useState } from "react"

export type ClientProfile = { firstName: string; lastName: string; phone: string }
const KEY = "schoolmatik_client"
const EVT = "schoolmatik-client"

/** Profil du client inscrit sur la vitrine, mémorisé dans le navigateur. */
export function useClient() {
  const [client, setClient] = useState<ClientProfile | null>(null)

  useEffect(() => {
    const load = () => {
      try {
        const s = localStorage.getItem(KEY)
        setClient(s ? JSON.parse(s) : null)
      } catch { setClient(null) }
    }
    load()
    window.addEventListener(EVT, load) // synchronise header, panier... dans la même page
    return () => window.removeEventListener(EVT, load)
  }, [])

  const save = (p: ClientProfile | null) => {
    try {
      if (p) localStorage.setItem(KEY, JSON.stringify(p))
      else localStorage.removeItem(KEY)
    } catch {}
    setClient(p)
    window.dispatchEvent(new Event(EVT))
  }

  return { client, save, logout: () => save(null) }
}
