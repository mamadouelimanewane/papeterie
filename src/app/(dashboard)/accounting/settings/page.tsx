"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AccShell, { btn, card, input } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Config = { vatDefault: number; deliveryVatRate: number; categoryRates: Record<string, number>; mode: "single" | "commission"; startDate: string; company: { name: string; ninea: string; rccm: string; address: string; city: string } }
type Cat = { name: string; products: number; ownRate: number }

export default function AccountingSettingsPage() {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [rates, setRates] = useState<Record<string, string>>({})
  const [cats, setCats] = useState<Cat[]>([])
  const [busy, setBusy] = useState(false)
  const { toast } = useFeedback()
  useEffect(() => {
    adminFetch<{ config: Config; categories: Cat[] }>("/api/admin/accounting/settings").then((r) => {
      setCfg(r.config); setCats(r.categories)
      setRates(Object.fromEntries(Object.entries(r.config.categoryRates).map(([k, v]) => [k, String(v)])))
    }).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
  }, [toast])

  const save = async () => {
    if (!cfg) return
    setBusy(true)
    try { await adminFetch("/api/admin/accounting/settings", { method: "PUT", body: { ...cfg, categoryRates: rates } }); toast("Réglages enregistrés : ils s'appliquent aux prochaines commandes") } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy(false) }
  }
  const rateSelect = (value: string, onChange: (v: string) => void, withDefault = true) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={input}>
      {withDefault && <option value="">Taux par défaut ({cfg?.vatDefault} %)</option>}
      <option value="0">0 % (exonéré)</option><option value="10">10 %</option><option value="18">18 %</option>
    </select>
  )

  return (
    <AccShell title="Réglages comptables">
      {!cfg ? <div className="h-40 animate-pulse rounded-xl bg-gray-50" /> : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className={`${card} space-y-4 p-5`}>
            <div className="text-sm font-semibold text-gray-700">TVA</div>
            <label className="block text-xs text-gray-500">Taux par défaut (%)<input value={cfg.vatDefault} onChange={(e) => setCfg({ ...cfg, vatDefault: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} className={`${input} mt-1 w-28`} /></label>
            <label className="block text-xs text-gray-500">TVA sur la livraison<div className="mt-1">{rateSelect(String(cfg.deliveryVatRate), (v) => setCfg({ ...cfg, deliveryVatRate: Number(v) }), false)}</div></label>
            <div>
              <div className="mb-1 text-xs text-gray-500">Taux par catégorie de produits</div>
              <table className="w-full text-sm">
                <tbody>
                  {cats.map((c) => (
                    <tr key={c.name} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-700">{c.name}<div className="text-[11px] text-gray-400">{c.products} produit(s){c.ownRate ? ` · ${c.ownRate} avec un taux propre` : ""}</div></td>
                      <td className="py-1.5 text-right">{rateSelect(rates[c.name] ?? "", (v) => setRates({ ...rates, [c.name]: v }))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-gray-400">Priorité : taux du produit (fiche produit, <Link href="/products" className="underline">Produits</Link>) → taux de sa catégorie → taux par défaut. Dans un kit, chaque article prend le taux du produit de même nom au catalogue (ou son propre taux, choisi dans l&apos;écran Kits). Le taux est figé sur chaque commande : un changement ne modifie pas les ventes passées. Les exonérations (livres scolaires…) sont à confirmer avec votre expert-comptable.</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className={`${card} space-y-3 p-5`}>
              <div className="text-sm font-semibold text-gray-700">Entreprise (en-têtes des états)</div>
              {(["name", "ninea", "rccm", "address", "city"] as const).map((k) => (
                <label key={k} className="block text-xs text-gray-500">{{ name: "Raison sociale", ninea: "NINEA", rccm: "RCCM", address: "Adresse", city: "Ville" }[k]}
                  <input value={cfg.company[k]} onChange={(e) => setCfg({ ...cfg, company: { ...cfg.company, [k]: e.target.value } })} className={`${input} mt-1 w-full`} /></label>
              ))}
            </div>
            <div className={`${card} space-y-3 p-5`}>
              <div className="text-sm font-semibold text-gray-700">Comptabilisation automatique</div>
              <label className="block text-xs text-gray-500">Modèle d&apos;activité
                <select value={cfg.mode} onChange={(e) => setCfg({ ...cfg, mode: e.target.value as Config["mode"] })} className={`${input} mt-1 w-full`}>
                  <option value="single">Une seule entreprise vend (tout le prix est du chiffre d&apos;affaires)</option>
                  <option value="commission">Plateforme à commission (seule la commission est du chiffre d&apos;affaires)</option>
                </select>
              </label>
              <label className="block text-xs text-gray-500">Comptabiliser les opérations à partir du<input type="date" value={cfg.startDate} onChange={(e) => setCfg({ ...cfg, startDate: e.target.value })} className={`${input} mt-1 w-full`} /></label>
              <p className="text-[11px] text-gray-400">Changer le modèle n&apos;affecte que les opérations pas encore comptabilisées.</p>
            </div>
            <button onClick={save} disabled={busy} className={`${btn} w-full`}>Enregistrer les réglages</button>
          </div>
        </div>
      )}
    </AccShell>
  )
}
