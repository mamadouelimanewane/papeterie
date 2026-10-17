import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicPage, LEGAL_PAGES } from "@/lib/legalPages"

export const dynamic = "force-dynamic" // le texte se modifie depuis le back-office

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPublicPage((await params).slug)
  return { title: page ? `${page.title} — Schoolmatik Librairie` : "Page introuvable" }
}

/** Pages d'information publiques : CGV, mentions légales, confidentialité, et toute page de contenu active. */
export default async function InfoPage({ params }: Props) {
  const { slug } = await params
  const page = await getPublicPage(slug)
  if (!page) notFound()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/shop" className="text-sm font-semibold text-brand-700 hover:underline">← Retour à la boutique</Link>
          <span className="text-xs text-slate-400">Schoolmatik Librairie</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">{page.title}</h1>
        <article className="whitespace-pre-line rounded-2xl bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-black/5">
          {page.content}
        </article>
        <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          {LEGAL_PAGES.map((p) => (
            <Link key={p.slug} href={`/shop/infos/${p.slug}`} className={p.slug === slug ? "font-semibold text-brand-700" : "hover:text-brand-700"}>{p.title}</Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
