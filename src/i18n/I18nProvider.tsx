"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { createTranslator, translate } from "./translator"

export type Lang = "fr" | "en"
const KEY = "schoolmatik_admin_lang"

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (fr: string) => string }>({
  lang: "fr", setLang: () => {}, t: (s) => s,
})

/**
 * Langue du back-office (préférence mémorisée dans le navigateur).
 * En anglais, l'interface est traduite à l'affichage (voir translator.ts) ;
 * `t()` sert pour les textes hors DOM (titre d'onglet, window.confirm…).
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr")

  useEffect(() => {
    // Lu après l'hydratation (le serveur ne connaît pas la préférence du navigateur)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { if (localStorage.getItem(KEY) === "en") setLangState("en") } catch { /* stockage indisponible */ }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    if (lang !== "en") return
    const tr = createTranslator(document.body)
    tr.start()
    return () => tr.stop()
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* stockage indisponible */ }
  }, [])
  const t = useCallback((fr: string) => (lang === "en" ? translate(fr) ?? fr : fr), [lang])
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
