import { createHash } from "crypto"
import { gzipSync } from "zlib"
import { del, put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { deriveKey, encrypt, keyFingerprint } from "./crypto"

/**
 * Sauvegarde complète de la base : toutes les tables (sauf l'historique des migrations), compressée (gzip)
 * puis chiffrée (AES-256-GCM, clé dérivée de BACKUP_KEY ou à défaut de NEXTAUTH_SECRET).
 *
 * Fichier .smbk : "SMBK1" | empreinte de clé (12 caractères) | iv | tag | données chiffrées.
 * Contenu déchiffré : { version, createdAt, tables: { NomTable: { order, rows: [ligne JSON…] } } }
 * Restauration : scripts/backup-restore.mjs (dans une base vide, tables recréées par `prisma db push`).
 */

export const RETENTION_DAYS = 30
const MAGIC = "SMBK1"

type Dump = { version: 1; createdAt: string; tables: Record<string, { order: number; rows: unknown[] }> }

/** Tables dans l'ordre des dépendances (une table référencée passe avant celles qui la référencent). */
async function tablesInOrder(): Promise<string[]> {
  const tables = (await prisma.$queryRaw<{ t: string }[]>`
    SELECT table_name AS t FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`).map((r) => r.t)
  const fks = await prisma.$queryRaw<{ child: string; parent: string }[]>`
    SELECT tc.table_name AS child, ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`
  const out: string[] = []
  const visit = (t: string, seen: Set<string>) => {
    if (out.includes(t) || seen.has(t)) return
    seen.add(t)
    for (const f of fks.filter((x) => x.child === t && x.parent !== t)) visit(f.parent, seen)
    out.push(t)
  }
  for (const t of tables.sort()) visit(t, new Set())
  return out
}

/** Export JSON de toutes les tables (row_to_json : types restitués à l'identique par json_populate_recordset). */
export async function dumpDatabase(): Promise<{ dump: Dump; rows: number }> {
  const order = await tablesInOrder()
  const tables: Dump["tables"] = {}
  let rows = 0
  for (const [i, t] of order.entries()) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) continue
    const r = await prisma.$queryRawUnsafe<{ j: string }[]>(`SELECT row_to_json(x)::text AS j FROM "${t}" x`)
    tables[t] = { order: i, rows: r.map((x) => JSON.parse(x.j)) }
    rows += r.length
  }
  return { dump: { version: 1, createdAt: new Date().toISOString(), tables }, rows }
}

export function packBackup(dump: Dump): Buffer {
  const key = deriveKey("backup")
  const body = encrypt(gzipSync(Buffer.from(JSON.stringify(dump), "utf8"), { level: 9 }), key)
  return Buffer.concat([Buffer.from(MAGIC + keyFingerprint(key), "ascii"), body])
}

export const backupFileName = (d = new Date()) => `schoolmatik-sauvegarde-${d.toISOString().slice(0, 16).replace(/[:T]/g, "-")}.smbk`

export const storageConfigured = () => !!process.env.BLOB_READ_WRITE_TOKEN

/**
 * Crée une sauvegarde, la stocke (Vercel Blob, si configuré) et l'enregistre dans l'historique.
 * Renvoie aussi le fichier (téléchargement manuel). Les sauvegardes stockées de plus de 30 jours sont supprimées.
 */
export async function runBackup(kind: "auto" | "manuel", createdBy: string | null, store = true) {
  try {
    const { dump, rows } = await dumpDatabase()
    const file = packBackup(dump)
    const checksum = createHash("sha256").update(file).digest("hex")
    let location: string | null = null
    if (store && storageConfigured()) {
      const blob = await put(`sauvegardes/${backupFileName()}`, file, { access: "public", addRandomSuffix: true, contentType: "application/octet-stream" })
      location = blob.url
    }
    const rec = await prisma.backup.create({ data: { kind, status: "ok", size: file.length, rows, location, checksum, createdBy } })
    await pruneBackups()
    return { ok: true as const, record: rec, file }
  } catch (e) {
    const error = e instanceof Error ? e.message.slice(0, 300) : "Erreur inconnue"
    const rec = await prisma.backup.create({ data: { kind, status: "échec", error, createdBy } }).catch(() => null)
    return { ok: false as const, record: rec, error }
  }
}

/** Rétention : fichiers stockés de plus de 30 jours supprimés (l'historique garde la trace). */
export async function pruneBackups() {
  const old = await prisma.backup.findMany({ where: { location: { not: null }, createdAt: { lt: new Date(Date.now() - RETENTION_DAYS * 86_400_000) } } })
  for (const b of old) {
    try { if (storageConfigured()) await del(b.location!) } catch (e) { console.error("[backup] suppression", e) }
    await prisma.backup.update({ where: { id: b.id }, data: { location: null } })
  }
}
