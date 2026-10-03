// Convertit le fichier de stock Moukat (.xlsx) en data/moukat.json, sans dependance.
// Usage : node scripts/xlsx-to-json.mjs "C:\chemin\STOCK ... .xlsx"
// (decompresse le .xlsx avec tar.exe sous Windows 10+, ou unzip sous Linux/macOS)
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const src = process.argv[2]
if (!src) { console.error("Usage: node scripts/xlsx-to-json.mjs <fichier.xlsx>"); process.exit(1) }

const dir = mkdtempSync(join(tmpdir(), "moukat-"))
copyFileSync(src, join(dir, "f.zip"))
// bsdtar de Windows lit les .zip ; ailleurs on utilise unzip
if (process.platform === "win32") execFileSync(join(process.env.SystemRoot ?? "C:\Windows", "System32", "tar.exe"), ["-xf", "f.zip"], { cwd: dir })
else execFileSync("unzip", ["-q", "f.zip"], { cwd: dir })

const unesc = (s) => s.replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
const ss = [...readFileSync(join(dir, "xl/sharedStrings.xml"), "utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)]
  .map((m) => unesc([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")))
const names = [...readFileSync(join(dir, "xl/workbook.xml"), "utf8").matchAll(/<sheet name="([^"]*)"/g)].map((m) => unesc(m[1]))

const rows = []
names.forEach((sheet, i) => {
  const x = readFileSync(join(dir, `xl/worksheets/sheet${i + 1}.xml`), "utf8")
  for (const r of x.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    if (+r[1] < 5) continue // titre + en-tetes
    const row = {}
    for (const c of r[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = (c[3] || "").match(/<v>([\s\S]*?)<\/v>/)
      if (v) row[c[1]] = /t="s"/.test(c[2]) ? ss[+v[1]] : v[1]
    }
    if (!row.B) continue
    rows.push({ sheet, code: String(row.A ?? "").trim(), name: row.B.trim(), qty: Number(row.C), price: Number(row.D) })
  }
})
rmSync(dir, { recursive: true, force: true })

writeFileSync("data/moukat.json", JSON.stringify(rows, null, 1))
console.log(`${rows.length} lignes -> data/moukat.json`)
