// Vérification et restauration d'une sauvegarde Schoolmatik (.smbk).
//
//   Vérifier (déchiffre et compte les lignes, n'écrit rien) :
//     node --env-file=.env.local scripts/backup-restore.mjs sauvegarde.smbk --verify
//
//   Restaurer dans une base VIDE (créée puis préparée avec `npx prisma db push` sur cette base) :
//     node --env-file=.env.local scripts/backup-restore.mjs sauvegarde.smbk "postgresql://…base-cible…"
//
// La clé de déchiffrement est dérivée de BACKUP_KEY (ou, à défaut, de NEXTAUTH_SECRET) : il faut la même
// valeur que sur le serveur au moment de la sauvegarde. Conseil : restaurer dans une nouvelle base (branche
// Neon), vérifier, puis faire pointer DATABASE_URL de Vercel vers elle.
import { readFileSync } from "node:fs"
import { createDecipheriv, createHash, hkdfSync } from "node:crypto"
import { gunzipSync } from "node:zlib"
import { createRequire } from "node:module"

const [file, target] = process.argv.slice(2)
const verifyOnly = process.argv.includes("--verify")
if (!file || (!target && !verifyOnly)) {
  console.error("Usage : backup-restore.mjs <fichier.smbk> (--verify | <URL de la base cible>)")
  process.exit(1)
}
const secret = process.env.BACKUP_KEY || process.env.NEXTAUTH_SECRET
if (!secret) { console.error("BACKUP_KEY ou NEXTAUTH_SECRET requis dans l'environnement"); process.exit(1) }

const key = Buffer.from(hkdfSync("sha256", secret, "schoolmatik", "schoolmatik:backup", 32))
const raw = readFileSync(file)
if (raw.subarray(0, 5).toString("ascii") !== "SMBK1") { console.error("Ce fichier n'est pas une sauvegarde Schoolmatik"); process.exit(1) }
const fp = raw.subarray(5, 17).toString("ascii")
if (fp !== createHash("sha256").update(key).digest("hex").slice(0, 12)) {
  console.error("Mauvaise clé : cette sauvegarde a été chiffrée avec une autre valeur de BACKUP_KEY / NEXTAUTH_SECRET"); process.exit(1)
}
const body = raw.subarray(17)
const d = createDecipheriv("aes-256-gcm", key, body.subarray(0, 12))
d.setAuthTag(body.subarray(12, 28))
const dump = JSON.parse(gunzipSync(Buffer.concat([d.update(body.subarray(28)), d.final()])).toString("utf8"))
const tables = Object.entries(dump.tables).sort((a, b) => a[1].order - b[1].order)
console.log(`Sauvegarde du ${dump.createdAt} — ${tables.length} tables, ${tables.reduce((s, [, t]) => s + t.rows.length, 0)} lignes`)
for (const [name, t] of tables) if (t.rows.length) console.log(`  ${name.padEnd(22)} ${t.rows.length}`)
if (verifyOnly) { console.log("Fichier intact et déchiffrable."); process.exit(0) }

const require = createRequire(import.meta.url)
const pg = require("pg")
const db = new pg.Client({ connectionString: target })
await db.connect()
try {
  for (const [name] of tables) {
    const n = Number((await db.query(`SELECT count(*) AS n FROM "${name}"`)).rows[0].n)
    if (n > 0) throw new Error(`La table ${name} de la base cible n'est pas vide : restauration refusée (utilisez une base neuve)`)
  }
  await db.query("BEGIN")
  for (const [name, t] of tables) {
    for (let i = 0; i < t.rows.length; i += 500) {
      await db.query(`INSERT INTO "${name}" SELECT * FROM json_populate_recordset(NULL::"${name}", $1::json)`, [JSON.stringify(t.rows.slice(i, i + 500))])
    }
  }
  // Compteurs auto-incrémentés (ex. User.userId) recalés après l'import
  const seqs = (await db.query(`SELECT c.relname AS t, a.attname AS col, pg_get_serial_sequence(format('%I', c.relname), a.attname) AS seq
    FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND pg_get_serial_sequence(format('%I', c.relname), a.attname) IS NOT NULL`)).rows
  for (const s of seqs) await db.query(`SELECT setval($1, GREATEST(COALESCE((SELECT max("${s.col}") FROM "${s.t}"), 0), 1))`, [s.seq])
  await db.query("COMMIT")
  console.log("Restauration terminée.")
} catch (e) {
  await db.query("ROLLBACK").catch(() => {})
  console.error("Restauration annulée :", e.message)
  process.exitCode = 1
} finally {
  await db.end()
}
