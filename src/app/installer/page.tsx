"use client"

import { useEffect, useState } from "react"

type AppCard = { key: "client" | "livreur" | "admin"; name: string; who: string; desc: string; path: string; color: string }

const APPS: AppCard[] = [
  { key: "client", name: "Schoolmatik — Client", who: "Parents, élèves, étudiants", desc: "Commander livres et fournitures, suivre sa livraison.", path: "/client", color: "#4F46E5" },
  { key: "livreur", name: "Schoolmatik — Livreur", who: "Livreurs", desc: "Voir les commandes, livrer avec les codes, naviguer vers le client.", path: "/livreur", color: "#059669" },
  { key: "admin", name: "Schoolmatik — Admin", who: "Équipe de la librairie", desc: "Commandes, produits, livreurs, finances et réglages.", path: "/admin", color: "#111827" },
]

function Qr({ url }: { url: string }) {
  const [src, setSrc] = useState("")
  useEffect(() => {
    let off = false
    import("qrcode").then((m) => m.toDataURL(url, { width: 220, margin: 1, color: { dark: "#111827", light: "#ffffff" } })).then((d) => { if (!off) setSrc(d) }).catch(() => {})
    return () => { off = true }
  }, [url])
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={`Code QR ${url}`} width={132} height={132} className="rounded-lg ring-1 ring-slate-200" /> : <div className="h-[132px] w-[132px] rounded-lg bg-slate-100" />
}

export default function InstallerPage() {
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState("")
  // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture de window.location apres l hydratation (SSR : vide)
  useEffect(() => { setOrigin(window.location.origin) }, [])

  const copy = async (url: string, key: string) => {
    try { await navigator.clipboard.writeText(url); setCopied(key); setTimeout(() => setCopied(""), 1800) } catch { window.prompt("Copiez ce lien :", url) }
  }
  const share = async (a: AppCard, url: string) => {
    if (navigator.share) { try { await navigator.share({ title: a.name, text: a.desc, url }) } catch { /* annulé */ } } else copy(url, a.key)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <main className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Installer les applications Schoolmatik</h1>
          <p className="mt-2 text-sm text-slate-500">Un raccourci sur l&apos;écran d&apos;accueil du téléphone, sans passer par un magasin d&apos;applications. Ouvrez le lien (ou scannez le code QR) sur le téléphone, puis suivez les étapes ci-dessous.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          {APPS.map((a) => {
            const url = origin + a.path
            return (
              <section key={a.key} className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/pwa/${a.key}-192.png`} alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl shadow" />
                <h2 className="mt-3 text-base font-bold text-slate-900">{a.name}</h2>
                <p className="text-xs font-semibold" style={{ color: a.color }}>{a.who}</p>
                <p className="mt-2 text-xs text-slate-500">{a.desc}</p>
                <div className="my-4">{origin ? <Qr url={url} /> : <div className="h-[132px] w-[132px]" />}</div>
                <code className="mb-3 break-all rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{url || a.path}</code>
                <div className="flex w-full gap-2">
                  <a href={a.path} className="flex-1 rounded-xl py-2 text-sm font-semibold text-white" style={{ backgroundColor: a.color }}>Ouvrir</a>
                  <button onClick={() => copy(url, a.key)} className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-700">{copied === a.key ? "Copié ✓" : "Copier"}</button>
                  <button onClick={() => share(a, url)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" aria-label="Partager">↗</button>
                </div>
              </section>
            )
          })}
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
            <h3 className="font-bold text-slate-900">🤖 Android (Chrome)</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Ouvrez le lien dans <b>Chrome</b>.</li>
              <li>Touchez <b>« Installer »</b> dans la bannière en bas de l&apos;écran.</li>
              <li>Sinon : menu <b>⋮</b> puis <b>« Installer l&apos;application »</b> (ou « Ajouter à l&apos;écran d&apos;accueil »).</li>
              <li>L&apos;icône apparaît parmi vos applications.</li>
            </ol>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
            <h3 className="font-bold text-slate-900">🍎 iPhone / iPad (Safari)</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Ouvrez le lien dans <b>Safari</b> (pas dans une autre application).</li>
              <li>Touchez le bouton <b>Partager</b> ⬆️ en bas de l&apos;écran.</li>
              <li>Choisissez <b>« Sur l&apos;écran d&apos;accueil »</b>, puis <b>Ajouter</b>.</li>
              <li>L&apos;icône apparaît sur l&apos;écran d&apos;accueil.</li>
            </ol>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">Chaque application a sa propre icône : vous pouvez installer les trois sur le même téléphone. Les applications Google Play et App Store viendront ensuite.</p>
      </main>
    </div>
  )
}
