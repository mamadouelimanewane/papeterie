"use client"

import { useCallback, useEffect, useState } from "react"
import { CloudUpload, Download } from "lucide-react"
import SecurityTabs from "@/components/admin/SecurityTabs"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Backup = { id: string; createdAt: string; kind: string; status: string; size: number; rows: number; location: string | null; checksum: string | null; error: string | null; createdBy: string | null }
type Data = { backups: Backup[]; storage: boolean; retentionDays: number; dedicatedKey: boolean }
const size = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1000))} Ko`)
const btn = "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"

export default function BackupsPage() {
  const [d, setD] = useState<Data | null>(null)
  const [busy, setBusy] = useState<"" | "store" | "download">("")
  const [err, setErr] = useState<string | null>(null)
  const { toast } = useFeedback()
  const load = useCallback(() => { adminFetch<Data>("/api/admin/backups").then(setD).catch((e) => setErr(e instanceof Error ? e.message : "Erreur")) }, [])
  useEffect(() => { load() }, [load])

  /** Téléchargement manuel : sauvegarde fraîche, fichier chiffré enregistré sur cet ordinateur. */
  const download = async () => {
    setBusy("download")
    try {
      const r = await fetch("/api/admin/backups?download=1", { method: "POST" })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Sauvegarde impossible")
      const name = /filename="([^"]+)"/.exec(r.headers.get("content-disposition") ?? "")?.[1] ?? "schoolmatik-sauvegarde.smbk"
      const url = URL.createObjectURL(await r.blob())
      const a = document.createElement("a")
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
      toast("Sauvegarde téléchargée : rangez-la sur un support séparé (clé USB, disque, Drive)")
      load()
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy("") }
  }
  const storeNow = async () => {
    setBusy("store")
    try { await adminFetch("/api/admin/backups", { method: "POST" }); toast("Sauvegarde effectuée"); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy("") }
  }

  return (
    <div>
      <SecurityTabs title="Sauvegardes" actions={<>
        <button onClick={download} disabled={!!busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}><Download size={14} /> {busy === "download" ? "Préparation…" : "Télécharger une sauvegarde"}</button>
        {d?.storage && <button onClick={storeNow} disabled={!!busy} className={`${btn} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}><CloudUpload size={14} /> Sauvegarder maintenant</button>}
      </>} />
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {d && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className={`rounded-xl border p-4 text-sm shadow-sm ${d.storage ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-100 bg-amber-50 text-amber-800"}`}>
              {d.storage
                ? <>Sauvegarde automatique <b>chaque nuit à 2 h</b>, chiffrée, conservée {d.retentionDays} jours.</>
                : <>
                  <b>Sauvegarde automatique pas encore active.</b> Pour l&apos;activer : Vercel → projet → <i>Storage</i> → <i>Create</i> → <i>Blob</i>, reliez-le au projet puis redéployez. En attendant, utilisez « Télécharger une sauvegarde ».
                </>}
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 text-xs text-gray-600 shadow-sm">
              <div className="mb-1 text-sm font-semibold text-gray-700">Contenu et protection</div>
              <ul className="list-disc space-y-1 pl-4">
                <li>Toute la base : produits, kits, commandes, clients, livreurs, comptabilité, paramètres, journal d&apos;audit.</li>
                <li>Fichier compressé et <b>chiffré (AES-256)</b> : illisible sans la clé du serveur{d.dedicatedKey ? " (BACKUP_KEY)" : " (NEXTAUTH_SECRET ; définissez une BACKUP_KEY dédiée et gardez-en une copie hors ligne)"}.</li>
                <li>Les mots de passe y figurent seulement sous forme chiffrée (empreintes).</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 text-xs text-gray-600 shadow-sm">
              <div className="mb-1 text-sm font-semibold text-gray-700">Restaurer</div>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Créer une base neuve (Neon → <i>Branches</i> → <i>Create</i>) et y préparer les tables : <code>npx prisma db push</code>.</li>
                <li>Vérifier le fichier : <code>node scripts/backup-restore.mjs fichier.smbk --verify</code>.</li>
                <li>Restaurer : <code>node scripts/backup-restore.mjs fichier.smbk &quot;URL de la base neuve&quot;</code>.</li>
                <li>Faire pointer <code>DATABASE_URL</code> de Vercel vers la nouvelle base, puis redéployer.</li>
              </ol>
              <p className="mt-2">Neon conserve aussi un historique qui permet de revenir à un instant précis (selon votre offre).</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-3 py-2">Date</th><th className="px-2">Type</th><th className="px-2">Résultat</th><th className="px-2 text-right">Lignes</th><th className="px-2 text-right">Taille</th><th className="px-3">Fichier</th></tr>
              </thead>
              <tbody>
                {d.backups.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucune sauvegarde pour l&apos;instant.</td></tr>}
                {d.backups.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">{new Date(b.createdAt).toLocaleString("fr-FR")}</td>
                    <td className="px-2 text-xs">{b.kind === "auto" ? "Automatique" : `Manuelle${b.createdBy ? ` (${b.createdBy})` : ""}`}</td>
                    <td className="px-2 text-xs">{b.status === "ok" ? <span className="text-emerald-600">✓ Réussie</span> : <span className="text-red-600" title={b.error ?? ""}>✗ Échec</span>}</td>
                    <td className="px-2 text-right text-xs">{b.rows ? b.rows.toLocaleString("fr-FR") : ""}</td>
                    <td className="px-2 text-right text-xs">{b.size ? size(b.size) : ""}</td>
                    <td className="px-3 text-xs">{b.location ? <a href={b.location} className="text-brand-700 hover:underline">Télécharger</a> : <span className="text-gray-400">{b.status === "ok" ? "non conservé" : ""}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
