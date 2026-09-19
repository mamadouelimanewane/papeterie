"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Category = { id: string; name: string }

export default function GestionPage() {
  const [code, setCode] = useState("")
  const [tab, setTab] = useState<"product" | "category">("product")
  const [cats, setCats] = useState<Category[]>([])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  // Categorie
  const [catName, setCatName] = useState("")
  // Produit
  const [pName, setPName] = useState("")
  const [pPrice, setPPrice] = useState("")
  const [pCat, setPCat] = useState("")
  const [pImage, setPImage] = useState("")
  const [pStock, setPStock] = useState("")

  const loadCats = () => fetch("/api/categories").then((r) => r.json()).then((d) => setCats(Array.isArray(d) ? d : [])).catch(() => {})
  useEffect(() => { loadCats() }, [])

  async function send(payload: any) {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch("/api/gestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...payload }),
      })
      const d = await res.json()
      if (res.ok) return { ok: true, d }
      return { ok: false, text: d.error ?? "Erreur" }
    } catch (e: any) {
      return { ok: false, text: e?.message ?? "Erreur reseau" }
    } finally { setBusy(false) }
  }

  async function addCategory() {
    if (!catName.trim()) return
    const r = await send({ kind: "category", name: catName })
    if (r.ok) { setMsg({ ok: true, text: `Categorie "${catName}" creee.` }); setCatName(""); loadCats() }
    else setMsg({ ok: false, text: r.text })
  }
  async function addProduct() {
    if (!pName.trim() || !pPrice) return
    const r = await send({ kind: "product", name: pName, price: pPrice, category: pCat || null, image: pImage || null, stock: pStock || 0 })
    if (r.ok) { setMsg({ ok: true, text: `Produit "${pName}" ajoute.` }); setPName(""); setPPrice(""); setPImage(""); setPStock("") }
    else setMsg({ ok: false, text: r.text })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">{"⚙️"}</span>
          <div className="leading-tight">
            <div className="font-extrabold text-indigo-700">Gestion du catalogue</div>
            <div className="text-[11px] text-slate-400">Ajouter des categories et des produits</div>
          </div>
          <Link href="/shop" className="ml-auto text-sm text-indigo-600">Voir la boutique &rarr;</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 rounded-xl bg-white p-4 ring-1 ring-slate-100">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Code marchand</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} type="password" placeholder="Code d'acces" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </div>

        <div className="mb-4 inline-flex rounded-full bg-white p-1 ring-1 ring-slate-200">
          <button onClick={() => setTab("product")} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "product" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Nouveau produit</button>
          <button onClick={() => setTab("category")} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "category" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Nouvelle categorie</button>
        </div>

        {msg && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</div>
        )}

        {tab === "category" ? (
          <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div>
              <label className="text-sm font-medium">Nom de la categorie</label>
              <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ex: Sport, Informatique, Arts plastiques..." className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <button onClick={addCategory} disabled={busy || !code} className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white disabled:opacity-50">
              {busy ? "..." : "Creer la categorie"}
            </button>
            <div className="pt-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Categories existantes ({cats.length})</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {cats.map((c) => <span key={c.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs">{c.name}</span>)}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nom du produit</label>
                <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Ex: Cahier Seyes 96 pages" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Prix (F)</label>
                <input value={pPrice} onChange={(e) => setPPrice(e.target.value)} type="number" placeholder="500" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <input value={pStock} onChange={(e) => setPStock(e.target.value)} type="number" placeholder="50" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Categorie</label>
                <select value={pCat} onChange={(e) => setPCat(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">- Choisir -</option>
                  {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Image (URL, optionnel)</label>
                <input value={pImage} onChange={(e) => setPImage(e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
            <button onClick={addProduct} disabled={busy || !code} className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white disabled:opacity-50">
              {busy ? "..." : "Ajouter le produit"}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
