// Cherche sur Open Library (couvertures par ISBN) les livres du fichier Moukat et ecrit
// scripts/covers-openlibrary.json : { "<isbn>": "<url de la couverture>" }.
// Seuls les ISBN reellement servis (HTTP 200) sont gardes. Relancer apres un nouveau fichier de stock.
//   node scripts/fetch-covers.mjs
import { readFileSync, writeFileSync } from "node:fs"

const rows = JSON.parse(readFileSync("data/moukat.json", "utf8"))
const isbns = rows.filter((r) => /^97[89][0-9]{10}$/.test(r.code))
// ISBN a ecarter : 978-1-234-56789-7 est l'ISBN factice classique (la couverture servie est celle d'un autre livre).
const EXCLUDE = new Set(["9781234567897"])
const covers = {}
for (const r of isbns) {
  if (EXCLUDE.has(r.code)) continue
  const url = `https://covers.openlibrary.org/b/isbn/${r.code}-M.jpg`
  try {
    const res = await fetch(url + "?default=false", { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) })
    if (res.ok) { covers[r.code] = url; console.log("OK  ", r.code, r.name) }
  } catch { /* reseau : on ignore ce livre */ }
}
writeFileSync("scripts/covers-openlibrary.json", JSON.stringify(covers, null, 1) + String.fromCharCode(10))
console.log(`${Object.keys(covers).length}/${isbns.length} couvertures -> scripts/covers-openlibrary.json`)
