// Cherche sur Wikimedia Commons une image LIBRE (CC0 / domaine public : aucune attribution requise)
// pour chaque TYPE de petit materiel (colle, ciseaux, regle...), la telecharge en 400 px dans
// public/generic/<type>.jpg et ecrit scripts/generic-images.json (regles de correspondance + source).
//
//   node scripts/fetch-generic-images.mjs            -> telecharge, ecrit le manifeste
//   node scripts/fetch-generic-images.mjs --list     -> liste seulement les candidats, sans rien ecrire
//
// Ces images illustrent un TYPE d'article, pas une marque ni un modele precis : a utiliser tant qu'on n'a pas
// la photo du produit (public/products/<code-barres>.jpg, toujours prioritaire).
import { mkdirSync, writeFileSync } from "node:fs"

const LIST_ONLY = process.argv.includes("--list")
const UA = { "User-Agent": "SchoolmatikCatalogue/1.0 (mamadouastelwane@gmail.com)" }
const FREE = /^(cc0|cc 0|public domain|pdm|cc-zero|attribution not required)/i

// `pick` : fragment du titre Commons choisi apres controle visuel (sinon, premiere image libre).
// Types sans image libre convenable (ardoise, craie, equerre, feutres...) : volontairement absents.
// L'ordre compte : la premiere regle qui correspond (sous-chaine du nom en majuscules) gagne.
const TYPES = [
  { key: "gourde", match: ["GOURDE", "THERMO", "COOLER", "MILTON"], query: "water bottle" },
  { key: "trousse", match: ["TROUSSE"], query: "pencil case" },
  { key: "ciseaux", match: ["CISEAU"], query: "scissors", pick: "Scissors - PD.jpg" },
  { key: "colle", match: ["COLLE", "GLUE"], query: "glue stick" },
  { key: "taille-crayon", match: ["TAILLE"], query: "pencil sharpener" },
  { key: "gomme", match: ["GOMME"], query: "eraser", pick: "Pink Pearl eraser.jpg" },
  { key: "regle", match: ["REGLE"], query: "ruler" },
  { key: "compas", match: ["COMPAS"], query: "drawing compass", pick: "Two school compasses" },
  { key: "rapporteur", match: ["RAPPORTEUR"], query: "protractor" },
  { key: "agrafes", match: ["AGRAF", "DEGRAFEUSE"], query: "stapler" },
  { key: "trombones", match: ["TROMBONE"], query: "paper clips" },
  { key: "scotch", match: ["SCOTCH", "ADHESIF"], query: "adhesive tape roll", pick: "Adhesive tapes clear" },
  { key: "mine", match: ["MINE CRITERIUM", "MINES"], query: "mechanical pencil", exact: "Mechanical pencil lead spilling out 051907.jpg" },
  { key: "marqueur-tableau", match: ["WHITE BOARD", "POUR TABLEAU", "TABLEAU BLANC", "MARQUEUR TABLEAU"], query: "whiteboard marker", exact: "Whiteboard markers.jpg" },
  { key: "marqueur", match: ["MARKER", "MARQUEUR", "POWER LIN"], query: "permanent marker", pick: "Sharpie-marker-types" },
  { key: "feutres", match: ["FEUTRE"], query: "felt-tip pens", exact: "Color-Pen 20121001 224914.jpg" },
  { key: "craie-couleur", match: ["CRAIE COULEUR", "CRAIES"], query: "colored chalk", pick: "Kids-toy-chalk-colored" },
  { key: "stylo", match: ["STYLO", "ROLLER"], query: "ballpoint pen" },
  { key: "crayon-couleur", match: ["CRAYONS DE COULEUR", "CRAYON DE COULEUR", "CRAYON COULEUR", "CRAYONS COULEUR", "CRAYONS DE 12 COULEURS", "CRAYON 12 COULEURS", "12 CRAYONS COULEUR"], query: "colored pencils" },
  { key: "crayon-noir", match: ["CRAYON NOIR", "CRAYONS NOIR", "CRAYON HB", "CRAYONS HB"], query: "pencils", pick: "Minimal pencils on yellow" },
  { key: "surligneur", match: ["SURLIGN", "HIGHLIGHTER"], query: "highlighter pen" },
  { key: "correcteur", match: ["CORRECT", "WHITE PEPS"], query: "correction tape" },
  { key: "pinceau", match: ["PINCEAU"], query: "paint brush", pick: "Jar of Paint Brushes" },
  { key: "pastels", match: ["PASTEL"], query: "oil pastels" },
  { key: "classeur", match: ["CLASSEUR"], query: "ring binder" },
  { key: "enveloppe", match: ["ENVELOPPE"], query: "envelope", pick: "Envelope timbrado" },
  { key: "calculatrice", match: ["CALCULATRI"], query: "scientific calculator" },
  { key: "souris", match: ["SOURIS"], query: "computer mouse" },
  { key: "perforateur", match: ["PERFORATEUR"], query: "hole punch" },
  { key: "elastiques", match: ["BRACELET", "ELASTIQUE"], query: "rubber bands" },
]

// Image choisie par son titre exact (la recherche Commons n'est pas stable d'un appel a l'autre).
async function byTitle(file) {
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
    action: "query", format: "json", titles: "File:" + file, prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: "400", origin: "*",
  })
  const j = await (await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) })).json()
  const p = Object.values(j.query?.pages ?? {})[0]
  const ii = p?.imageinfo?.[0]
  if (!ii) return []
  const license = ii.extmetadata?.LicenseShortName?.value ?? "?"
  return FREE.test(license) ? [{ title: p.title, ii, license }] : []
}

async function candidates(query, relaxed = false) {
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrlimit: "30",
    gsrsearch: query + " filetype:bitmap", prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: "400", origin: "*",
  })
  const j = await (await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) })).json()
  return Object.values(j.query?.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .map((p) => ({ title: p.title, ii: p.imageinfo?.[0] }))
    .filter((c) => c.ii && /image[/](jpeg|png)/.test(c.ii.mime) && c.ii.width >= (relaxed ? 350 : 600) && c.ii.height >= (relaxed ? 250 : 600))
    .map((c) => ({ ...c, license: c.ii.extmetadata?.LicenseShortName?.value ?? "?" }))
    .filter((c) => FREE.test(c.license))
}

if (!LIST_ONLY) mkdirSync("public/generic", { recursive: true })
const manifest = []
for (const t of TYPES) {
  let list = []
  try { list = t.exact ? await byTitle(t.exact) : await candidates(t.query, !!t.pick) } catch (e) { console.log("ERREUR", t.key, e.message) }
  const pick = t.exact ? list[0] : t.pick ? list.find((c) => c.title.includes(t.pick)) : list[0]
  if (!pick) { console.log("AUCUNE image libre :", t.key, `(${t.query})`); continue }
  console.log(`${t.key.padEnd(16)} ${pick.license.padEnd(14)} ${pick.title}  (+${list.length - 1} autres)`)
  if (LIST_ONLY) continue
  const img = await fetch(pick.ii.thumburl, { headers: UA, signal: AbortSignal.timeout(30000) })
  if (!img.ok) { console.log("  telechargement impossible", img.status); continue }
  writeFileSync(`public/generic/${t.key}.jpg`, Buffer.from(await img.arrayBuffer()))
  manifest.push({ key: t.key, match: t.match, image: `/generic/${t.key}.jpg`, source: pick.ii.descriptionurl, title: pick.title, license: pick.license })
  await new Promise((r) => setTimeout(r, 400))
}
if (!LIST_ONLY) {
  writeFileSync("scripts/generic-images.json", JSON.stringify(manifest, null, 1) + String.fromCharCode(10))
  console.log(`\n${manifest.length}/${TYPES.length} types illustres -> public/generic/ + scripts/generic-images.json`)
}
