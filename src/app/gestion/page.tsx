"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Category = { id: string; name: string }

const LOW_STOCK = 10

function StockBadge({ n }: { n: number }) {
  if (n <= 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Rupture</span>
  if (n <= LOW_STOCK) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Stock bas</span>
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">OK</span>
}

function StockRow({ p, disabled, onSave }: { p: any; disabled: boolean; onSave: (stock: string, price: string, status: string) => void }) {
  const [stock, setStock] = useState(String(p.stock ?? 0))
  const [price, setPrice] = useState(String(p.price ?? ""))
  const [status, setStatus] = useState(p.status ?? "Active")
  const dirty = stock !== String(p.stock ?? 0) || price !== String(p.price ?? "") || status !== (p.status ?? "Active")
  const n = Number(stock) || 0
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-2">
        <div className="flex items-center gap-2">
          {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />}
          <span className="font-medium">{p.name}</span>
        </div>
      </td>
      <td className="py-2 pr-2"><input value={price} onChange={e => setPrice(e.target.value)} type="number" className="w-20 rounded border px-2 py-1 text-sm" /></td>
      <td className="py-2 pr-2">
        <div className="flex items-center gap-2">
          <input value={stock} onChange={e => setStock(e.target.value)} type="number" className={`w-16 rounded border px-2 py-1 text-sm ${n <= LOW_STOCK ? "border-amber-400 bg-amber-50" : ""}`} />
          <StockBadge n={n} />
        </div>
      </td>
      <td className="py-2 pr-2">
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded border px-2 py-1 text-xs">
          <option value="Active">Actif</option><option value="Inactive">Inactif</option>
        </select>
      </td>
      <td className="py-2">
        <button onClick={() => onSave(stock, price, status)} disabled={disabled || !dirty}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Enregistrer</button>
      </td>
    </tr>
  )
}

export default function GestionPage() {
  const [code, setCode] = useState("")
  const [tab, setTab] = useState<"product" | "category" | "promo" | "stock">("product")
  const [products, setProducts] = useState<any[]>([])
  const loadProducts = () => fetch("/api/store?products=1").then(r => r.json()).then(d => setProducts(d?.products ?? [])).catch(() => {})
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
  // Promo
  const [prCode, setPrCode] = useState("")
  const [prDiscount, setPrDiscount] = useState("")
  const [prType, setPrType] = useState("Percentage")
  const [prMax, setPrMax] = useState("")
  const [prExp, setPrExp] = useState("")

  const loadCats = () => fetch("/api/categories").then((r) => r.json()).then((d) => setCats(Array.isArray(d) ? d : [])).catch(() => {})
  useEffect(() => { loadCats() }, [])
  useEffect(() => { if (tab === "stock") loadProducts() }, [tab])

  async function saveStock(p: any, stock: string, price: string, status: string) {
    const r = await send({ kind: "product-update", id: p.id, stock, price, status })
    if (r.ok) { setMsg({ ok: true, text: `"${p.name}" mis à jour` }); loadProducts() }
    else setMsg({ ok: false, text: r.text })
  }

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
  async function addPromo() {
    if (!prCode.trim() || !prDiscount) return
    const r = await send({ kind: "promo", promoCode: prCode, discount: prDiscount, type: prType, maxUses: prMax || null, expiresAt: prExp || null })
    if (r.ok) { setMsg({ ok: true, text: `Code promo "${prCode.toUpperCase()}" cree.` }); setPrCode(""); setPrDiscount(""); setPrMax(""); setPrExp("") }
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
          <button onClick={() => setTab("promo")} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "promo" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Promotion</button>
          <button onClick={() => setTab("stock")} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "stock" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Stock</button>
        </div>

        {msg && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</div>
        )}

        {tab === "category" && (
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
        )}

        {tab === "product" && (
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

        {tab === "promo" && (
          <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Code promo</label>
                <input value={prCode} onChange={(e) => setPrCode(e.target.value.toUpperCase())} placeholder="RENTREE2026" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm uppercase" />
              </div>
              <div>
                <label className="text-sm font-medium">Remise</label>
                <input value={prDiscount} onChange={(e) => setPrDiscount(e.target.value)} type="number" placeholder="10" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select value={prType} onChange={(e) => setPrType(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="Percentage">Pourcentage (%)</option>
                  <option value="Fixed">Montant fixe (F)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Utilisations max</label>
                <input value={prMax} onChange={(e) => setPrMax(e.target.value)} type="number" placeholder="100" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Expiration</label>
                <input value={prExp} onChange={(e) => setPrExp(e.target.value)} type="date" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
            <button onClick={addPromo} disabled={busy || !code} className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white disabled:opacity-50">
              {busy ? "..." : "Creer le code promo"}
            </button>
          </div>
        )}
        {tab === "stock" && (
          <div className="overflow-x-auto rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Stock des produits ({products.length})</span>
              <button onClick={loadProducts} className="text-xs text-indigo-600">Rafraîchir</button>
            </div>
            {(() => {
              const low = products.filter((p) => (p.stock ?? 0) <= LOW_STOCK)
              const out = products.filter((p) => (p.stock ?? 0) <= 0)
              if (low.length === 0) return null
              return (
                <div className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  ⚠️ <b>{low.length} produit(s) à réapprovisionner</b> (stock ≤ {LOW_STOCK}{out.length > 0 ? `, dont ${out.length} en rupture` : ""}) : {low.map((p) => p.name).slice(0, 4).join(", ")}{low.length > 4 ? "…" : ""}
                </div>
              )
            })()}
            <table className="w-full text-sm">
              <thead className="border-b"><tr className="text-left text-xs text-slate-400">
                <th className="py-2">Produit</th><th className="py-2">Prix (F)</th><th className="py-2">Stock</th><th className="py-2">Statut</th><th></th>
              </tr></thead>
              <tbody>
                {products.map(p => <StockRow key={p.id} p={p} disabled={!code} onSave={(s, pr, st) => saveStock(p, s, pr, st)} />)}
                {products.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">Aucun produit.</td></tr>}
              </tbody>
            </table>
            {!code && <p className="mt-2 text-xs text-amber-600">Saisis le code marchand en haut pour pouvoir enregistrer.</p>}
          </div>
        )}
      </main>
    </div>
  )
}
