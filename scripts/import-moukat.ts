/**
 * Import du stock Moukat (data/moukat.json) dans le catalogue de la boutique active.
 *
 *   npm run import:moukat                      -> DRY-RUN : rapport, aucune ecriture, pas de base requise
 *   npm run import:moukat -- --apply           -> ecrit en base (upsert par code-barres)
 *   npm run import:moukat -- --apply --hide data/a-masquer.txt
 *                                              -> masque (status Inactive) les produits existants dont le nom
 *                                                 figure dans le fichier (un nom exact par ligne). Rien n'est supprime.
 *   npm run import:moukat -- --json out.json   -> exporte le catalogue normalise
 *
 * Regenerer data/moukat.json : node scripts/xlsx-to-json.mjs "<fichier.xlsx>"
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

type Row = { sheet: string; code: string; name: string; qty: number; price: number }
export type Item = {
  barcode: string; name: string; price: number; stock: number
  category: string; description: string | null; image: string | null
}

const args = process.argv.slice(2)
const APPLY = args.includes("--apply")
const hideFile = args.includes("--hide") ? args[args.indexOf("--hide") + 1] : null
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null

// ---------------------------------------------------------------- nettoyage des noms
const LOWER = new Set(["de", "du", "des", "la", "le", "les", "et", "a", "au", "aux", "en", "pour", "sur", "un", "une", "d", "l"])
const KEEP_UPPER = new Set(["CP", "CI", "CE1", "CE2", "CM1", "CM2", "PS", "MS", "GS", "TLE", "II", "III", "IV", "ABC", "HB", "PVC", "CD", "DVD", "PDF", "KASY", "REF", "KOCC", "BIC", "CE"])

function titleCase(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").replace(/\s+-\s*$/, "").trim()
  return cleaned
    .split(" ")
    .map((w, i) => {
      const up = w.toUpperCase()
      if (KEEP_UPPER.has(up) || /\d/.test(w)) return up // CP, A4, 17X22, T-0004...
      const lw = w.toLowerCase()
      if (i > 0 && LOWER.has(lw.replace(/[':]/g, ""))) return lw
      // met une majuscule apres chaque separateur (apostrophe, tiret, parenthese)
      return lw.replace(/(^|['’\-(/])([a-zàâçéèêëîïôûù])/g, (_, s, c) => s + c.toUpperCase())
    })
    .join(" ")
    .replace(/\bD'/g, "d'").replace(/\bL'/g, "l'").replace(/\bJ'/g, "J'")
}

// ---------------------------------------------------------------- categories
export const CATEGORIES = [
  "Livres", "Cahiers", "Écriture & coloriage", "Géométrie", "Colle, ciseaux & petit matériel",
  "Papier & blocs", "Classement & rangement", "Protège & couvre-livres", "Sacs & trousses",
  "Gourdes & boîtes repas", "Art & loisirs créatifs", "Bureau", "Divers",
]

// L'ordre compte : le premier motif qui correspond gagne.
const RULES: [string, RegExp][] = [
  ["Livres", /GRAMMAIRE|DICTIONNAIRE|LAROUSSE|\bBLED\b|CONJUGAISON|LIVRES? ARABE|EUGENIE GRANDET|VENDREDI OU|TERRITOIRES DE|CONTES ET FABLES|A L.OREE|SOLUTIONS POUR|SENEGALAISERIES/],
  ["Gourdes & boîtes repas", /GOURDE|THERMO|MILTON|COOLER|LUNCH|GOUTER|BOUTE A|BOITE REPAS|BIBERON|THERMOS/],
  ["Sacs & trousses", /\bSAC|CARTABLE|TROUSSE|CARTOUCHIERE|VALISE|\bEVERKI/],
  ["Géométrie", /\bREGLE|EQUERRE|COMPAS|RAPPORTEUR|GEOMETRI|GEO\b/],
  ["Classement & rangement", /PORTE.?DOC|PORT DOCUMENT|CLASSEUR|CHEMISE|PROTEGE.?DOC|INTERCALAIRE|TRIEUR|ARCHIVE|PARAPHEUR|LUTIN|RELIEUR|\bPINCES?\b|TROMBONE/],
  ["Protège & couvre-livres", /PROTEGE|COUVRE|COUVERTURE|PLASTIQUE ROUL|ROULEAU/],
  ["Écriture & coloriage", /STYLO|CRAYON|CRITERIUM|FEUTRE|MARKER|MARQUEUR|SURLIGN|ROLLER|EFFAC|CORRECT|WHITE PEPS|PORTE.?MINE|\bMINES?\b|\bBIC\b|CRAIE|FLUO|ENCRE|PLUME|GRIPIX/],
  ["Colle, ciseaux & petit matériel", /COLLE|CISEAU|AGRAF|PERFORATEUR|TAILLE.?CRAYON|EPONGE|ARDOISE|GOMME|SCOTCH|\bTAILLE\b|WHITE GLUE|ADHESIF|CUTTER|BRACELET|ELASTIQUE|MOUILLEUR|TRAC/],
  ["Papier & blocs", /PAPIER|BLOC|FEUILLE|\bRAME\b|ETIQUETTE|CARTON|POCHETTE|CARTE|ENVELOPPE|FICHES?|AGENDA|NOTES?\b|COPIES? DOUBLES?|CALEPIN|REPERTOIRE|REGISTRE/],
  ["Art & loisirs créatifs", /PEINTURE|PINCEAU|PATE|GOUACHE|AQUAREL|DESSIN|PERLE|PLASTILINE|PAILLETTE|PASTEL|CIRE|TOILE/],
  ["Bureau", /LIVRE D.OR|SOUS MAINS|CHIFFON|DATEUR|TAMPON|CALCULATRI|BADGE|TABLEAU|CHEVALET|AGRAFEUSE|DEGRAFEUSE|ETIQUETEUSE|CLAVIER|SAN ?DISK|CLE USB|SOURIS/],
]

function categorize(sheet: string, upperName: string): string {
  if (sheet === "LIVRES") return "Livres"
  if (sheet === "CAHIER") return "Cahiers"
  for (const [cat, re] of RULES) if (re.test(upperName)) return cat
  return "Divers"
}

// ---------------------------------------------------------------- images (niveau 1 : par categorie)
// Uniquement des photos deja utilisees et verifiees dans le projet. Les categories sans photo
// verifiee restent a null (la vitrine affiche alors son visuel par defaut) ; remplacez-les par les
// photos de Moukat via le nom de fichier = code-barres (voir README du catalogue).
const U = (id: string) => `https://images.unsplash.com/${id}?w=400`
export const CATEGORY_IMAGE: Record<string, string | null> = {
  "Livres": U("photo-1481627834876-b7833e8f5570"),
  "Cahiers": U("photo-1531346878377-a5be20888e57"),
  "Écriture & coloriage": U("photo-1583485088034-697b5bc54ccd"),
  "Géométrie": U("photo-1513475382585-d06e58bcb0e0"),
  "Colle, ciseaux & petit matériel": U("photo-1558618666-fcd25c85cd64"),
  "Art & loisirs créatifs": U("photo-1513364776144-60967b0f800f"),
  "Sacs & trousses": U("photo-1588072432836-e10032774350"),
}

// Photo reelle : public/products/<code-barres>.(jpg|jpeg|png|webp) prime sur l'image de categorie.
function localPhoto(barcode: string): string | null {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    if (existsSync(`public/products/${barcode}.${ext}`)) return `/products/${barcode}.${ext}`
  }
  return null
}

// ---------------------------------------------------------------- niveaux scolaires (livres)
const LEVEL_RE = /\b(CI|CP|CE1|CE2|CM1|CM2|6EME|5EME|4EME|3EME|2NDE|1ERE|TERMINALE|TLE|PS|MS|GS)\b/
const LEVEL_LABEL: Record<string, string> = {
  "6EME": "6ème", "5EME": "5ème", "4EME": "4ème", "3EME": "3ème", "2NDE": "2nde", "1ERE": "1ère",
  TERMINALE: "Terminale", TLE: "Terminale",
}

export function buildCatalogue(rows: Row[]): Item[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const k = r.name.toUpperCase().replace(/\s+/g, " ").trim()
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return rows.map((r) => {
    const upper = r.name.toUpperCase().replace(/\s+/g, " ").trim()
    const category = categorize(r.sheet, upper)
    let name = titleCase(r.name)
    // Meme designation avec plusieurs codes (editions differentes) : on distingue par la reference
    if ((counts.get(upper) ?? 0) > 1) name += ` (réf. ${r.code})`
    const lv = r.sheet === "LIVRES" ? upper.match(LEVEL_RE)?.[1] : undefined
    return {
      barcode: r.code,
      name,
      price: r.price,
      stock: Math.max(0, Math.round(r.qty)),
      category,
      description: lv ? `Niveau : ${LEVEL_LABEL[lv] ?? lv}` : null,
      image: localPhoto(r.code) ?? CATEGORY_IMAGE[category] ?? null,
    }
  })
}

// ---------------------------------------------------------------- rapport
function report(items: Item[]) {
  const byCat = new Map<string, number>()
  items.forEach((i) => byCat.set(i.category, (byCat.get(i.category) ?? 0) + 1))
  console.log(`\n${items.length} produits`)
  for (const c of CATEGORIES) console.log(`  ${c.padEnd(34)} ${byCat.get(c) ?? 0}`)
  console.log(`Stock : ${items.reduce((s, i) => s + i.stock, 0)} unites, valeur ${items.reduce((s, i) => s + i.stock * i.price, 0).toLocaleString("fr-FR")} F`)
  console.log(`Sans image : ${items.filter((i) => !i.image).length} | photos reelles : ${items.filter((i) => i.image?.startsWith('/products/')).length}`)
  const codes = new Set(items.map((i) => i.barcode))
  if (codes.size !== items.length) console.log(`ATTENTION : ${items.length - codes.size} code(s)-barres en double`)
  console.log("\nExemples :")
  ;[0, 1, 150, 300, 420, 600, 760].forEach((n) => items[n] && console.log(`  [${items[n].category}] ${items[n].name} - ${items[n].price} F x${items[n].stock}`))
  console.log("\nDivers (a verifier) :")
  items.filter((i) => i.category === "Divers").slice(0, 25).forEach((i) => console.log("  -", i.name))
}

// ---------------------------------------------------------------- ecriture en base
async function apply(items: Item[]) {
  const url = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL absente (lancer avec --env-file=.env)")
  console.log(`\nBase cible : ${new URL(url).host}`)
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
  try {
    const store = process.env.ACTIVE_STORE_ID
      ? await prisma.store.findUnique({ where: { id: process.env.ACTIVE_STORE_ID } })
      : await prisma.store.findFirst({ where: { status: "Active" }, orderBy: { createdAt: "asc" } })
    if (!store) throw new Error("Boutique active introuvable")
    console.log(`Boutique : ${store.name} (${store.id})`)

    for (let i = 0; i < CATEGORIES.length; i++) {
      const name = CATEGORIES[i]
      if (!(await prisma.category.findFirst({ where: { name } }))) {
        await prisma.category.create({ data: { name, segment: "Papeterie", status: "Active", sequence: i + 1, image: CATEGORY_IMAGE[name] ?? null } })
      }
    }

    let created = 0, updated = 0
    for (const it of items) {
      const existing = await prisma.product.findUnique({ where: { barcode: it.barcode } })
      if (existing) {
        // Reimport : prix, stock et categorie suivent le fichier ; nom/image/description retouches a la main sont conserves.
        await prisma.product.update({ where: { id: existing.id }, data: { price: it.price, stock: it.stock, category: it.category, status: "Active", ...(it.image?.startsWith("/products/") ? { image: it.image } : {}) } })
        updated++
      } else {
        await prisma.product.create({ data: { ...it, storeId: store.id, status: "Active" } })
        created++
      }
    }
    console.log(`Produits : ${created} crees, ${updated} mis a jour`)

    if (hideFile) {
      const names = readFileSync(hideFile, "utf8").split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean)
      const r = await prisma.product.updateMany({ where: { storeId: store.id, barcode: null, name: { in: names } }, data: { status: "Inactive" } })
      console.log(`Produits masques (Inactive) : ${r.count} / ${names.length} noms listes`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const rows: Row[] = JSON.parse(readFileSync("data/moukat.json", "utf8"))
  const bad = rows.filter((r) => !r.code || !r.name || !(r.price > 0) || !Number.isFinite(r.qty))
  if (bad.length) throw new Error(`${bad.length} ligne(s) invalide(s), ex. ${JSON.stringify(bad[0])}`)
  const items = buildCatalogue(rows)
  report(items)
  if (jsonOut) { writeFileSync(jsonOut, JSON.stringify(items, null, 1)); console.log(`\nExport -> ${jsonOut}`) }
  if (APPLY) await apply(items)
  else console.log("\nDRY-RUN : aucune ecriture. Ajouter --apply pour importer.")
}

main().catch((e) => { console.error(e); process.exit(1) })
