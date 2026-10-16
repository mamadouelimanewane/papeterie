"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { reportInstalled } from "@/app/shop/inviteTracking"
import { isSamsungBrowser, openInChromeUrl } from "@/lib/pwaBrowser"

type App = "client" | "livreur" | "admin"
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

const COLORS: Record<App, string> = { client: "#C61620", livreur: "#059669", admin: "#111827" }
// Boutique : l'invitation revient chaque jour tant que l'application n'est pas installée ; ailleurs, 7 jours
const DISMISS_DAYS: Record<App, number> = { client: 1, livreur: 7, admin: 7 }

/**
 * Enregistre le service worker et propose d'installer l'application sur l'écran d'accueil :
 *  - Android / Chrome : bouton « Installer » (événement beforeinstallprompt) ;
 *  - iPhone / Safari : mode d'emploi (« Partager » puis « Sur l'écran d'accueil »), car iOS n'a pas d'invite automatique.
 * Rien ne s'affiche si l'application est déjà installée (mode « standalone ») ou si l'invite a été fermée récemment.
 * Boutique sur téléphone : fenêtre au centre dès l'ouverture, avant de continuer ; si le navigateur ne propose pas
 * l'installation lui-même (Android sans invite), « Installer » mène au mode d'emploi (/shop/installer).
 */
export default function PwaRegister({ app, label }: { app: App; label: string }) {
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [visible, setVisible] = useState(false)
  const [phone, setPhone] = useState(false)
  const [samsung, setSamsung] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const onInstallPage = pathname?.startsWith("/shop/installer") ?? false // la page d'installation a son propre bouton

  useEffect(() => {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* non bloquant */ })
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) {
      if (app === "client") reportInstalled() // invitation personnelle : application lancée depuis l'écran d'accueil
      return
    }
    try {
      const at = Number(localStorage.getItem(`pwa-dismissed-${app}`) ?? 0)
      if (at && Date.now() - at < DISMISS_DAYS[app] * 86400_000) return
    } catch { /* stockage indisponible */ }

    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua) // Safari uniquement
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detection du navigateur apres l hydratation
    if (isIos) { setIos(true); setVisible(true) }
    // Samsung Internet : son installation est bloquée par Play Protect, on propose Chrome
    if (/android/i.test(ua) && isSamsungBrowser(ua)) { setSamsung(true); setVisible(true) }
    // Boutique sur un téléphone Android : invitation affichée même sans invite du navigateur
    if (app === "client" && /android/i.test(ua)) { setPhone(true); setVisible(true) }

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
    if (!event) { setVisible(false); router.push("/shop/installer"); return }
    await event.prompt()
    const choice = await event.userChoice
    setEvent(null)
    if (choice.outcome === "accepted") setVisible(false); else dismiss()
  }

  if (onInstallPage || !visible || (!event && !ios && !phone && !samsung)) return null
  const chromeLink = samsung ? openInChromeUrl(window.location.href) : ""

  // Boutique : fenêtre centrée, avant de continuer
  if (app === "client") return (
    <div role="dialog" aria-modal="true" aria-label={`Installer ${label}`} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/schoolmatik-logo-256.png" alt="Schoolmatik" width={96} height={96} className="mx-auto h-24 w-24 rounded-2xl shadow" />
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">Installer Schoolmatik sur votre téléphone ?</h2>
        <p className="mt-1 text-sm text-slate-500">Un raccourci sur l&apos;écran d&apos;accueil pour commander vos fournitures en un geste, comme une application.</p>
        {samsung ? (
          <>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-left text-sm text-slate-600">Sur ce téléphone, l&apos;installation se fait avec <b>Chrome</b> : la page s&apos;ouvre dans Chrome, puis touchez <b>Installer</b>.</p>
            <a href={chromeLink} className="mt-4 block w-full rounded-2xl py-3.5 text-base font-bold text-white shadow" style={{ backgroundColor: COLORS[app] }}>Ouvrir dans Chrome pour installer</a>
          </>
        ) : ios ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-left text-sm text-slate-600">Touchez <b>Partager</b> <span aria-hidden>⬆️</span> en bas de Safari, puis <b>« Sur l&apos;écran d&apos;accueil »</b> et <b>Ajouter</b>.</p>
        ) : (
          <button onClick={install} className="mt-5 w-full rounded-2xl py-3.5 text-base font-bold text-white shadow" style={{ backgroundColor: COLORS[app] }}>📲 Installer</button>
        )}
        <button onClick={dismiss} className="mt-3 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600">{ios ? "J'ai compris" : "Plus tard"}</button>
      </div>
    </div>
  )

  return (
    <div role="dialog" aria-label={`Installer ${label}`} className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/pwa/${app}-192.png?v=2`} alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
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
      {samsung ? (
        <a href={chromeLink} className="mt-3 block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white" style={{ backgroundColor: COLORS[app] }}>
          Ouvrir dans Chrome pour installer
        </a>
      ) : !ios && (
        <button onClick={install} className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: COLORS[app] }}>
          Installer
        </button>
      )}
    </div>
  )
}
