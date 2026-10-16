import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"
import { getActiveStoreId } from "@/lib/store"

/**
 * Recherche intelligente de la vitrine : un parent pose sa question en langage courant
 * (« fournitures pour un élève de CM2 », « livre de maths terminale S ») et l'IA choisit
 * les articles pertinents DANS le catalogue (elle ne peut renvoyer que des articles existants).
 *
 * Fournisseur :
 *  - Google Gemini si GOOGLE_API_KEY est défini (comme /api/ai/scan) ;
 *  - sinon un service compatible OpenAI : AI_SEARCH_BASE_URL (ex. http://localhost:3011/v1),
 *    AI_SEARCH_API_KEY, AI_SEARCH_MODEL (défaut « auto ») ;
 *  - sinon désactivée (le bouton n'apparaît pas dans la vitrine).
 */
export function aiSearchEnabled() {
  return !!process.env.GOOGLE_API_KEY || !!(process.env.AI_SEARCH_BASE_URL && process.env.AI_SEARCH_API_KEY)
}

export type AiSearchResult = { message: string; productIds: string[]; keywords: string[] }

const MAX_ITEMS = 24
const CATALOG_TTL_MS = 5 * 60_000
const ANSWER_TTL_MS = 30 * 60_000

type Item = { id: string; name: string; category: string; price: number; inStock: boolean; text: string; nameN: string; catN: string }
let catalogCache: { at: number; items: Item[]; categories: string[] } | null = null
const answers = new Map<string, { at: number; result: AiSearchResult }>()

/** Minuscules sans accents (« Géométrie » -> « geometrie »). */
const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

async function catalog() {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache
  const storeId = await getActiveStoreId()
  const rows = await prisma.product.findMany({
    where: { status: "Active", ...(storeId ? { storeId } : {}) },
    select: { id: true, name: true, category: true, price: true, stock: true },
  })
  const items = rows.map((p) => ({
    id: p.id, name: p.name, category: p.category ?? "", price: p.price, inStock: (p.stock ?? 0) > 0,
    text: norm(`${p.name} ${p.category ?? ""}`), nameN: norm(p.name), catN: norm(p.category ?? ""),
  }))
  catalogCache = { at: Date.now(), items, categories: [...new Set(items.map((i) => i.category).filter(Boolean))] }
  return catalogCache
}

/**
 * L'IA ne reçoit pas le catalogue (rapide et peu coûteux) : elle traduit la demande du parent en mots-clés
 * de recherche, rubriques et budget ; le serveur cherche ensuite ces mots dans le catalogue.
 */
function prompt(question: string, categories: string[]) {
  return `Tu es le conseiller de la librairie-papeterie Schoolmatik à Dakar (fournitures et livres scolaires du CI à la Terminale, programme sénégalais).
Transforme la demande d'un parent en recherche dans notre catalogue.
Rubriques du catalogue : ${categories.join(", ")}.
Réponds UNIQUEMENT en JSON :
{"message": "une phrase en français pour le parent", "keywords": ["mots à chercher dans le nom des articles"], "categories": ["rubriques utiles, prises dans la liste"], "maxPrice": nombre ou null}
Règles :
- keywords : 1 à 12 mots simples au singulier, jamais de mots généraux comme "livre", "fourniture", "scolaire" ou "article", tels qu'on les trouve dans un nom d'article (ex. "cahier", "stylo", "compas", "bescherelle", "mathematique", "terminale", "sac"). Mets d'abord les plus importants.
- Pour une classe ou une liste (ex. "fournitures CM2"), donne les articles typiques de cette classe (cahier, stylo, crayon, regle, equerre, gomme, taille-crayon, colle, ciseaux, ardoise…).
- Pour un livre, donne la matière et le niveau, avec les abréviations utilisées dans les noms d'articles : "tle" (terminale), "1ere", "2nde", "3e", "4e", "5e", "6e", "cm2", "cm1", "ce2", "ce1", "cp", "ci" (ex. "mathematique", "tle").
- maxPrice : seulement si un budget est indiqué ("pas cher" = 1000), en francs CFA, sinon null.
- Si la demande n'a rien à voir avec une librairie scolaire, keywords vide et message poli qui le dit.

Demande du parent : ${question}`
}

/** Extrait le premier objet JSON d'une réponse (avec ou sans bloc ```json). */
function parseJson(text: string): Record<string, unknown> {
  const clean = text.replace(/```(?:json)?/g, "").trim()
  const start = clean.indexOf("{"), end = clean.lastIndexOf("}")
  if (start < 0 || end <= start) throw new Error("Réponse IA illisible")
  return JSON.parse(clean.slice(start, end + 1))
}

async function ask(text: string): Promise<string> {
  const timeout = AbortSignal.timeout(20_000)
  if (process.env.GOOGLE_API_KEY) {
    const model = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY).getGenerativeModel({
      model: process.env.AI_SEARCH_MODEL || "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    })
    const r = await model.generateContent({ contents: [{ role: "user", parts: [{ text }] }] }, { signal: timeout })
    return r.response.text()
  }
  const res = await fetch(`${process.env.AI_SEARCH_BASE_URL!.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    signal: timeout,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_SEARCH_API_KEY}` },
    body: JSON.stringify({
      model: process.env.AI_SEARCH_MODEL || "auto",
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: text }],
    }),
  })
  if (!res.ok) throw new Error(`Service IA : HTTP ${res.status}`)
  const j = await res.json()
  return String(j?.choices?.[0]?.message?.content ?? "")
}

/** Mots trop généraux pour distinguer un article (la rubrique suffit). */
const GENERIC = new Set(["livre", "livres", "manuel", "manuels", "fourniture", "fournitures", "scolaire", "scolaires", "article", "articles", "ecole", "eleve", "classe", "enfant", "pas", "cher"])

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 1).map((x) => norm(x.trim())) : [])

/** Pertinence d'un mot-clé pour un article : nom qui commence par le mot > mot entier dans le nom > dans la rubrique. */
function rel(i: Item, k: string) {
  if (i.nameN.startsWith(k)) return 3
  if (startsAWord(i.nameN, k)) return 2
  if (k.length > 3 && i.nameN.includes(k)) return 1.5 // mot court (« tle ») : seulement en début de mot, pas dans « bottle »
  return i.catN.includes(k) ? 1 : 0
}

/** Le mot `k` commence-t-il un mot de `s` (précédé d'un espace, tiret, chiffre exclu…) ? */
function startsAWord(s: string, k: string) {
  for (let at = s.indexOf(k); at >= 0; at = s.indexOf(k, at + 1)) {
    if (at === 0 || !/[a-z0-9]/.test(s[at - 1])) return true
  }
  return false
}

/**
 * Sélection dans le catalogue : d'abord les articles qui réunissent plusieurs mots-clés (ex. « mathematique » + « tle »),
 * puis un article par mot-clé à tour de rôle (assortiment varié pour une liste de classe) ; à pertinence égale,
 * en stock et moins cher d'abord.
 */
function pick(items: Item[], keywords: string[], categories: string[], maxPrice: number | null) {
  const pool = items.filter((i) => maxPrice === null || i.price <= maxPrice)
  const inCats = (i: Item) => !categories.length || categories.includes(i.catN)
  const weight = (idx: number) => 1 + (keywords.length - idx) / keywords.length // premiers mots-clés plus importants
  const score = new Map(pool.map((i) => [i, keywords.reduce((s, k, idx) => s + rel(i, k) * weight(idx), 0) + (inCats(i) && categories.length ? 0.5 : 0)]))
  const byScore = (a: Item, b: Item) => score.get(b)! - score.get(a)! || Number(b.inStock) - Number(a.inStock) || a.price - b.price
  const hits = (i: Item) => keywords.filter((k) => rel(i, k) > 1).length // mots trouvés dans le NOM (pas seulement la rubrique)

  const out: Item[] = keywords.length > 1 ? pool.filter((i) => hits(i) >= 2).sort(byScore).slice(0, MAX_ITEMS) : []
  const lists = keywords.map((k) => pool.filter((i) => rel(i, k) > 0).sort((a, b) => rel(b, k) - rel(a, k) || Number(b.inStock) - Number(a.inStock) || a.price - b.price))
  for (let round = 0; out.length < MAX_ITEMS && lists.some((l) => l.length > round); round++) {
    for (const l of lists) if (l[round] && !out.includes(l[round])) out.push(l[round])
  }
  if (!out.length && categories.length) out.push(...pool.filter(inCats).sort(byScore))
  return [...new Set(out)].slice(0, MAX_ITEMS).map((i) => i.id)
}

export async function aiSearch(question: string): Promise<AiSearchResult> {
  const key = norm(question).replace(/\s+/g, " ").trim()
  const hit = answers.get(key)
  if (hit && Date.now() - hit.at < ANSWER_TTL_MS) return hit.result

  const { items, categories } = await catalog()
  const parsed = parseJson(await ask(prompt(question, categories)))
  // Pluriel retiré (« maths » -> « math » trouve aussi « Mathematique »)
  const keywords = [...new Set(strings(parsed.keywords).filter((k) => !GENERIC.has(k)).map((k) => (k.length > 4 && k.endsWith("s") ? k.slice(0, -1) : k)))].slice(0, 12)
  const cats = strings(parsed.categories)
  const maxPrice = typeof parsed.maxPrice === "number" && parsed.maxPrice > 0 ? parsed.maxPrice : null
  const productIds = keywords.length || cats.length ? pick(items, keywords, cats, maxPrice) : []
  const message = typeof parsed.message === "string" ? parsed.message.slice(0, 300) : ""
  const result = { message, productIds, keywords }

  if (answers.size > 500) answers.clear()
  answers.set(key, { at: Date.now(), result })
  return result
}
