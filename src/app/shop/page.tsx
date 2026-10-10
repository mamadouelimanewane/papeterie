"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useCart, fmt } from "./useCart"
import CartDrawer from "./CartDrawer"
import RegisterModal from "./RegisterModal"
import MyOrders from "./MyOrders"
import { useClient } from "./useClient"

type Product = { id: string; name: string; price: number; image?: string | null; category?: string | null; description?: string | null; stock?: number }
type Store = { id: string; name: string; address?: string | null; phone?: string | null; products?: Product[] }

const CAT_EMOJI: Record<string, string> = {
  Livres: "📚", Cahiers: "📓", Fournitures: "✏️", Geometrie: "📐",
  "Art & Creativite": "🎨", Informatique: "💻", Sport: "⚽",
  "Écriture & coloriage": "🖍️", "Colle, ciseaux & petit matériel": "✂️", "Papier & blocs": "🗒️",
  "Classement & rangement": "🗂️", "Protège & couvre-livres": "📘", "Sacs & trousses": "🎒",
  "Gourdes & boîtes repas": "🥤", "Art & loisirs créatifs": "🎨", Bureau: "🖥️", Géométrie: "📐",
}

// Ordre d'affichage des categories (les autres suivent, par ordre alphabetique)
const CAT_ORDER = [
  "Livres", "Cahiers", "Écriture & coloriage", "Géométrie", "Geometrie", "Colle, ciseaux & petit matériel",
  "Papier & blocs", "Classement & rangement", "Protège & couvre-livres", "Sacs & trousses",
  "Gourdes & boîtes repas", "Art & loisirs créatifs", "Bureau",
]
const catRank = (c?: string | null) => { const i = CAT_ORDER.indexOf(c ?? ""); return i === -1 ? CAT_ORDER.length : i }
const PAGE_SIZE = 60

export default function ShopPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeCat, setActiveCat] = useState<string>("Tout")
  const [cartOpen, setCartOpen] = useState(false)
  const [detail, setDetail] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null)
  const { cart, add, dec, inc, remove, removeMultiple, clear, count, total } = useCart()
  const { client, save: saveClient, logout } = useClient()
  const [registerOpen, setRegisterOpen] = useState(false)

  useEffect(() => {
    fetch("/api/store?products=1&view=shop").then((r) => r.json()).then(setStore).catch(() => setStore(null)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(id)
  }, [toast])

  const showToast = (msg: string) => setToast((t) => ({ msg, n: (t?.n ?? 0) + 1 }))

  const products = useMemo(
    () => [...(store?.products ?? [])].sort(
      (a, b) =>
        catRank(a.category) - catRank(b.category) ||
        Number(!!b.image) - Number(!!a.image) || // produits illustres d'abord
        a.name.localeCompare(b.name, "fr")
    ),
    [store]
  )
  const categories = useMemo(
    () => ["Tout", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))],
    [products]
  )
  const filtered = products.filter(
    (p) => (activeCat === "Tout" || p.category === activeCat) && p.name.toLowerCase().includes(query.toLowerCase())
  )
  const [visible, setVisible] = useState(PAGE_SIZE)
  useEffect(() => { setVisible(PAGE_SIZE) }, [activeCat, query])
  const shown = filtered.slice(0, visible)

  const addProduct = (p: Product) => { add(p); showToast(`${p.name} ajouté au panier`) }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
            <div className="space-y-1"><div className="h-3 w-40 animate-pulse rounded bg-slate-200" /><div className="h-2 w-28 animate-pulse rounded bg-slate-100" /></div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 pt-5">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-5 flex gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />)}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
                <div className="aspect-square animate-pulse bg-slate-200" />
                <div className="space-y-2 p-3"><div className="h-3 w-full animate-pulse rounded bg-slate-200" /><div className="h-4 w-16 animate-pulse rounded bg-slate-200" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (!store) return <main className="grid min-h-screen place-items-center text-red-600">Aucune boutique active.</main>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-sun-400 shadow-[inset_0_-3px_0_0_var(--color-brand-600)]">
        {/* Sur téléphone : nom tronqué et boutons compacts, pour que le panier reste toujours visible */}
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/schoolmatik-logo-128.png" alt="Schoolmatik" className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain shadow-sm ring-1 ring-black/5" />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-extrabold tracking-tight text-brand-700">{store.name}</div>
              <div className="hidden text-[11px] font-medium text-slate-700 sm:block">Fournitures &amp; livres scolaires - Dakar</div>
            </div>
          </div>
          <div className="ml-auto hidden flex-1 sm:block">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un article..."
              className="w-full max-w-md rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <MyOrders />
          {client ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-bold text-brand-700 ring-1 ring-black/5" title={`${client.firstName} ${client.lastName}`}>
                {client.firstName.charAt(0).toUpperCase()}{client.lastName.charAt(0).toUpperCase()}
              </span>
              <div className="hidden leading-tight md:block">
                <div className="text-sm font-semibold">{client.firstName}</div>
                <button onClick={logout} className="text-[11px] text-slate-700 hover:text-brand-700">Se déconnecter</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setRegisterOpen(true)}
              className="shrink-0 whitespace-nowrap rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 sm:px-3.5 sm:text-sm">
              S&apos;inscrire
            </button>
          )}
          <button onClick={() => setCartOpen(true)} aria-label="Panier" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white ring-1 ring-black/5">
            {"🛒"}
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{count}</span>}
          </button>
        </div>
        <div className="px-4 pb-3 sm:hidden">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..."
            className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400" />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-5">
        <div className="relative overflow-hidden rounded-2xl bg-sun-400 p-6 text-slate-900 ring-1 ring-sun-500/40 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sun-300" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full border-[14px] border-brand-600/10" />
          <div className="relative">
            <p className="inline-block rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Rentrée scolaire</p>
            <h1 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight text-brand-700 sm:text-4xl">Tous les livres &amp; fournitures, livrés à Dakar</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-slate-800">Cahiers, manuels, kits de géométrie, sacs… Commandez en ligne et payez par Wave ou Orange Money, sans vous déplacer.</p>
            <Link href="/shop/kits" className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">
            {"🎒"} Voir les kits par classe
            </Link>
          </div>
        </div>
        {!client && (
          <div className="mt-3 flex flex-col items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-sun-200 sm:flex-row sm:items-center">
            <span className="text-3xl">{"👋"}</span>
            <div className="flex-1">
              <div className="font-bold text-slate-800">Nouveau client ? Inscrivez-vous en 30 secondes</div>
              <div className="text-sm text-slate-500">Prénom, nom et téléphone suffisent : vos coordonnées seront pré-remplies à chaque commande.</div>
            </div>
            <button onClick={() => setRegisterOpen(true)} className="shrink-0 rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700">
              Créer mon compte
            </button>
          </div>
        )}
      </section>

      {/* Categories */}
      <div className="mx-auto max-w-6xl px-4 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCat === c ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"}`}>
              {c === "Tout" ? "🛍️ Tout" : `${CAT_EMOJI[c] ?? "🏷️"} ${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-6xl px-4 py-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">{filtered.length} article{filtered.length > 1 ? "s" : ""}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <div key={p.id} onClick={() => setDetail(p)} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:shadow-lg">
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {p.image
                  ? <img src={p.image} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  : <div className="flex h-full items-center justify-center bg-gradient-to-br from-sun-100 via-sun-100 to-sun-50 text-6xl transition group-hover:scale-105">{CAT_EMOJI[p.category ?? ""] ?? "📦"}</div>}
                {p.category && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{p.category}</span>}
                {typeof p.stock === "number" && p.stock <= 0 && <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">Rupture</span>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="line-clamp-2 text-sm font-medium leading-tight">{p.name}</div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-extrabold text-brand-700">{fmt(p.price)}</span>
                  <button onClick={(e) => { e.stopPropagation(); addProduct(p) }} className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700" aria-label="Ajouter">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="py-10 text-center text-slate-400">Aucun article trouvé.</p>}
        {filtered.length > shown.length && (
          <div className="mt-6 text-center">
            <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
              Afficher plus ({filtered.length - shown.length} restants)
            </button>
          </div>
        )}
      </main>

      {/* Banniere Kits par classe (bas de page) */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <Link href="/shop/kits" className="flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white transition hover:brightness-105">
          <span className="text-4xl">{"🎒"}</span>
          <div className="flex-1">
            <div className="text-lg font-extrabold">Kits scolaires par classe</div>
            <div className="text-sm text-amber-50">Toute la liste de fournitures, de la CI à la Terminale (L, S1, S2) — prête en 1 clic.</div>
          </div>
          <span className="hidden shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-600 sm:block">Voir les kits</span>
        </Link>
      </section>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-400">
        {store.name} - {store.address} - {store.phone}
      </footer>
      {count > 0 && <div className="h-20" aria-hidden />}

      {/* Detail produit */}
      {detail && (
        <div className="fixed inset-0 z-[55] grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square w-full bg-slate-100">
              {detail.image
                ? <img src={detail.image} alt={detail.name} className="h-full w-full object-cover" />
                : <div className="flex h-full items-center justify-center bg-gradient-to-br from-sun-100 to-sun-100 text-7xl">{CAT_EMOJI[detail.category ?? ""] ?? "📦"}</div>}
              <button onClick={() => setDetail(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow">✕</button>
              {detail.category && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-600">{detail.category}</span>}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold leading-tight">{detail.name}</h3>
              {detail.description && <p className="mt-1 text-sm text-slate-500">{detail.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-2xl font-extrabold text-brand-700">{fmt(detail.price)}</span>
                {typeof detail.stock === "number" && (detail.stock > 0
                  ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">En stock ({detail.stock})</span>
                  : <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">Rupture de stock</span>)}
              </div>
              <button onClick={() => { addProduct(detail); setDetail(null) }} disabled={typeof detail.stock === "number" && detail.stock <= 0}
                className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {typeof detail.stock === "number" && detail.stock <= 0 ? "Indisponible" : "Ajouter au panier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast confirmation d'ajout */}
      {toast && (
        <div key={toast.n} className="fixed left-1/2 top-4 z-[70] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[11px]">✓</span>
          <span className="line-clamp-1">{toast.msg}</span>
        </div>
      )}

      {/* Barre panier flottante */}
      {count > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:pb-4">
          <button onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl bg-brand-600 px-5 py-3.5 text-white shadow-2xl ring-1 ring-black/5 transition hover:bg-brand-700">
            <span className="flex items-center gap-2.5 font-semibold">
              <span className="relative text-lg">
                {"🛒"}
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-sun-400 px-1 text-[11px] font-bold text-slate-900">{count}</span>
              </span>
              Voir mon panier
            </span>
            <span className="flex items-center gap-2 font-extrabold">{fmt(total)} <span className="text-lg">›</span></span>
          </button>
        </div>
      )}

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)}
        onDone={(p, already) => {
          saveClient(p); setRegisterOpen(false)
          showToast(already ? `Bon retour ${p.firstName} ! Ce numéro était déjà inscrit.` : `Bienvenue ${p.firstName}, votre compte est créé !`)
        }} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} count={count} total={total} dec={dec} inc={inc} remove={remove} removeMultiple={removeMultiple} clear={clear} />
    </div>
  )
}
