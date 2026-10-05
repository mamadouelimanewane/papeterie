"use client"

import { useEffect, useState } from "react"

type App = "client" | "livreur" | "admin"
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

const COLORS: Record<App, string> = { client: "#4F46E5", livreur: "#059669", admin: "#111827" }
const DISMISS_DAYS = 7

/**
 * Enregistre le service worker et propose d'installer l'application sur l'écran d'accueil :
 *  - Android / Chrome : bouton « Installer » (événement beforeinstallprompt) ;
 *  - iPhone / Safari : mode d'emploi (« Partager » puis « Sur l'écran d'accueil »), car iOS n'a pas d'invite automatique.
 * Rien ne s'affiche si l'application est déjà installée (mode « standalone ») ou si l'invite a été fermée il y a moins de 7 jours.
 */
export default function PwaRegister({ app, label }: { app: App; label: string }) {
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* non bloquant */ })
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return
    try {
      const at = Number(localStorage.getItem(`pwa-dismissed-${app}`) ?? 0)
      if (at && Date.now() - at < DISMISS_DAYS * 86400_000) return
    } catch { /* stockage indisponible */ }

    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua) // Safari uniquement
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detection du navigateur apres l hydratation
    if (isIos) { setIos(true); setVisible(true) }

    const onPrompt = (e: Event) => { e.preventDefault(); setEvent(e as InstallEvent); setVisible(true) }
    const onInstalled = () => setVisible(false)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled) }
  }, [app])

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(`pwa-dismissed-${app}`, String(Date.now())) } catch { /* ignoré */ }
  }
  const install = async () => {
    if (!event) return
    await event.prompt()
    const choice = await event.userChoice
    setEvent(null)
    if (choice.outcome === "accepted") setVisible(false); else dismiss()
  }

  if (!visible || (!event && !ios)) return null
  return (
    <div role="dialog" aria-label={`Installer ${label}`} className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/pwa/${app}-192.png`} alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">Installer {label}</p>
          {ios ? (
            <p className="mt-0.5 text-xs text-slate-500">Touchez <b>Partager</b> <span aria-hidden>⬆️</span> en bas de Safari, puis <b>« Sur l&apos;écran d&apos;accueil »</b>.</p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">Accès direct depuis l&apos;écran d&apos;accueil, comme une application.</p>
          )}
        </div>
        <button onClick={dismiss} aria-label="Fermer" className="text-slate-400">✕</button>
      </div>
      {!ios && (
        <button onClick={install} className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: COLORS[app] }}>
          Installer
        </button>
      )}
    </div>
  )
}
