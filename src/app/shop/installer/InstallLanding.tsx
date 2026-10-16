"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useClient } from "../useClient"
import { INVITE_KEY, reportInstalled } from "../inviteTracking"

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }
type Device = "android" | "ios" | "ios-other" | "in-app" | "desktop"

function detectDevice(): Device {
  const ua = navigator.userAgent
  // Navigateurs intégrés (Facebook, Instagram, TikTok…) : l'installation y est impossible
  if (/FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat/i.test(ua)) return "in-app"
  if (/iphone|ipad|ipod/i.test(ua)) return /crios|fxios|edgios/i.test(ua) ? "ios-other" : "ios"
  if (/android/i.test(ua)) return "android"
  return "desktop"
}

function Qr({ url }: { url: string }) {
  const [src, setSrc] = useState("")
  useEffect(() => {
    let off = false
    import("qrcode").then((m) => m.toDataURL(url, { width: 240, margin: 1 })).then((d) => { if (!off) setSrc(d) }).catch(() => {})
    return () => { off = true }
  }, [url])
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="Code QR du lien" width={160} height={160} className="mx-auto rounded-xl ring-1 ring-slate-200" /> : <div className="mx-auto h-40 w-40 rounded-xl bg-slate-100" />
}

/**
 * Page d'installation de l'application client.
 * Sans code : lien universel à diffuser (/app). Avec code : lien personnel (/i/<code>) qui pré-remplit le profil.
 */
export default function InstallLanding({ code }: { code: string | null }) {
  const { client, save } = useClient()
  const [device, setDevice] = useState<Device | null>(null)
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [inviteError, setInviteError] = useState(false)
  const [url, setUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
     
    setDevice(detectDevice())
    setUrl(window.location.href)
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) { window.location.replace("/shop?source=pwa"); return }
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallEvent) }
    const onInstalled = () => { setInstalled(true); reportInstalled() }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled) }
  }, [])

  // Lien personnel : profil du client pré-rempli dans la vitrine
  useEffect(() => {
    if (!code) return
    fetch("/api/shop/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, event: "open" }) })
      .then(async (r) => {
        if (!r.ok) { setInviteError(true); return }
        const p = await r.json()
        try { localStorage.setItem(INVITE_KEY, code) } catch { /* ignoré */ }
        if (p.phone) save({ firstName: p.firstName, lastName: p.lastName, phone: p.phone })
      })
      .catch(() => setInviteError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule ouverture par chargement
  }, [code])

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const choice = await prompt.userChoice
    setPrompt(null)
    if (choice.outcome === "accepted") { setInstalled(true); reportInstalled() }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt("Copiez ce lien :", url) }
  }

  const hello = client?.firstName ? `Bonjour ${client.firstName} 👋` : "Bienvenue 👋"

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-600 to-brand-700 px-4 py-8">
      <main className="mx-auto max-w-md">
        <div className="text-center text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/schoolmatik-logo-256.png" alt="" width={88} height={88} className="mx-auto h-[88px] w-[88px] rounded-3xl shadow-xl ring-4 ring-white/20" />
          <h1 className="mt-4 text-2xl font-extrabold">{hello}</h1>
          <p className="mt-2 text-sm text-brand-50">Installez <b>Schoolmatik</b> : livres et fournitures scolaires livrés à Dakar, kits complets par classe, paiement sécurisé par Wave ou Orange Money.</p>
          {inviteError && <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-brand-50">Ce lien d&apos;invitation a expiré : vous pouvez tout de même installer l&apos;application.</p>}
        </div>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-2xl">
          {installed ? (
            <div className="text-center">
              <p className="text-4xl">✅</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">Application installée</h2>
              <p className="mt-1 text-sm text-slate-500">Retrouvez l&apos;icône <b>Schoolmatik</b> sur votre écran d&apos;accueil.</p>
            </div>
          ) : device === "android" ? (
            prompt ? (
              <button onClick={install} className="w-full rounded-2xl bg-brand-600 py-4 text-lg font-bold text-white shadow-lg active:scale-[.98]">📲 Installer l&apos;application</button>
            ) : (
              <Steps title="Installer sur Android" steps={[<>Ouvrez ce lien dans <b>Chrome</b>.</>, <>Touchez le menu <b>⋮</b> en haut à droite.</>, <>Choisissez <b>« Installer l&apos;application »</b> (ou « Ajouter à l&apos;écran d&apos;accueil »).</>]} />
            )
          ) : device === "ios" ? (
            <Steps title="Installer sur iPhone" steps={[<>Touchez le bouton <b>Partager</b> <span aria-hidden>⬆️</span> en bas de l&apos;écran.</>, <>Faites défiler et choisissez <b>« Sur l&apos;écran d&apos;accueil »</b>.</>, <>Touchez <b>Ajouter</b> : l&apos;icône Schoolmatik apparaît.</>]} />
          ) : device === "ios-other" || device === "in-app" ? (
            <div>
              <Steps title="Ouvrez ce lien dans votre navigateur" steps={[<>Copiez le lien ci-dessous.</>, <>Collez-le dans <b>{device === "ios-other" ? "Safari" : "Chrome ou Safari"}</b>.</>, <>Suivez ensuite les étapes d&apos;installation.</>]} />
              <button onClick={copy} className="mt-3 w-full rounded-2xl bg-brand-600 py-3 font-bold text-white">{copied ? "Lien copié ✓" : "Copier le lien"}</button>
            </div>
          ) : device === "desktop" ? (
            <div className="text-center">
              <h2 className="font-bold text-slate-900">Scannez avec votre téléphone</h2>
              <p className="mb-4 mt-1 text-sm text-slate-500">L&apos;application s&apos;installe sur téléphone Android ou iPhone.</p>
              {url && <Qr url={url} />}
            </div>
          ) : (
            <div className="h-14" />
          )}

          <Link href="/shop" className="mt-4 block w-full rounded-2xl bg-slate-100 py-3 text-center font-semibold text-slate-700">
            {installed ? "Ouvrir la boutique" : "Continuer sans installer →"}
          </Link>
        </section>

        <ul className="mt-6 space-y-2 text-sm text-brand-50">
          <li>📚 Livres et fournitures de la CI à la Terminale</li>
          <li>🎒 Kits complets par classe, prêts à commander</li>
          <li>🛵 Livraison à domicile à Dakar, suivi du livreur</li>
          <li>📶 Fonctionne même avec une connexion faible</li>
        </ul>
      </main>
    </div>
  )
}

function Steps({ title, steps }: { title: string; steps: React.ReactNode[] }) {
  return (
    <div>
      <h2 className="font-bold text-slate-900">{title}</h2>
      <ol className="mt-3 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
