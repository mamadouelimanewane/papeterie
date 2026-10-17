"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import SecurityTabs from "@/components/admin/SecurityTabs"
import { adminFetch, fmtDate } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Data = {
  policy: { require2fa: boolean }
  status: { admins: number; without2fa: number; inactive: number; failures24h: number; envAdmin: boolean; backupStorage: boolean; dedicatedBackupKey: boolean; lastBackup: string | null }
}

export default function SecurityPage() {
  const [d, setD] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast, confirm } = useFeedback()
  const load = useCallback(() => { adminFetch<Data>("/api/admin/security").then(setD).catch((e) => setErr(e instanceof Error ? e.message : "Erreur")) }, [])
  useEffect(() => { load() }, [load])

  const toggle2fa = async () => {
    if (!d) return
    const next = !d.policy.require2fa
    if (next && !(await confirm({ title: "Exiger la double authentification ?", message: `Les ${d.status.without2fa} administrateur(s) qui ne l'ont pas encore activée devront le faire (Mon profil) avant de pouvoir utiliser le back-office. Faites-le d'abord pour votre propre compte.`, confirmLabel: "Exiger" }))) return
    setBusy(true)
    try { await adminFetch("/api/admin/security", { method: "PUT", body: { require2fa: next } }); toast(next ? "Double authentification obligatoire" : "Double authentification facultative"); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy(false) }
  }

  const row = (ok: boolean, label: React.ReactNode, hint?: React.ReactNode) => (
    <li className="flex items-start gap-3 border-b border-gray-50 py-2.5 last:border-0">
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${ok ? "bg-emerald-500" : "bg-amber-500"}`}>{ok ? "✓" : "!"}</span>
      <div><div className="text-sm text-gray-800">{label}</div>{hint && <div className="text-xs text-gray-500">{hint}</div>}</div>
    </li>
  )

  return (
    <div>
      <SecurityTabs title="Sécurité" />
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {d && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-gray-700">État de la sécurité</div>
            <ul>
              {row(d.status.without2fa === 0, `Double authentification : ${d.status.admins - d.status.without2fa} / ${d.status.admins} administrateur(s) actif(s)`, d.status.without2fa ? <>Chacun l&apos;active dans <Link href="/settings/profile" className="underline">Mon profil</Link>.</> : undefined)}
              {row(!d.status.envAdmin, d.status.envAdmin ? "Compte de secours actif (variables ADMIN_EMAIL / ADMIN_PASSWORD)" : "Pas de compte de secours par variables d'environnement", d.status.envAdmin ? "Ce compte contourne la double authentification : retirez ADMIN_PASSWORD dans Vercel une fois vos comptes nominatifs créés." : undefined)}
              {row(d.status.inactive === 0, `${d.status.inactive} compte(s) jamais connecté(s) ou inactif(s) depuis 90 jours`, d.status.inactive ? <>Désactivez les comptes inutiles dans <Link href="/settings/sub-admin" className="underline">Administrateurs</Link>.</> : undefined)}
              {row(d.status.failures24h < 10, `${d.status.failures24h} échec(s) de connexion sur 24 h`, <Link href="/settings/security/audit?action=login" className="underline">Voir le journal</Link>)}
              {row(d.status.backupStorage, d.status.backupStorage ? "Sauvegardes automatiques stockées (Vercel Blob)" : "Stockage des sauvegardes automatiques non configuré", d.status.backupStorage ? `Dernière sauvegarde : ${d.status.lastBackup ? fmtDate(d.status.lastBackup) : "aucune"}` : <>Créez un « Blob store » dans Vercel (voir <Link href="/settings/security/backups" className="underline">Sauvegardes</Link>). En attendant, téléchargez une sauvegarde manuellement.</>)}
              {row(d.status.dedicatedBackupKey, d.status.dedicatedBackupKey ? "Clé de chiffrement des sauvegardes dédiée (BACKUP_KEY)" : "Sauvegardes chiffrées avec la clé de session du serveur", d.status.dedicatedBackupKey ? undefined : "Recommandé : définir BACKUP_KEY dans Vercel et la conserver hors ligne (indispensable pour restaurer).")}
              {row(true, "Sessions limitées à 12 h ; compte désactivé ou mot de passe réinitialisé : déconnexion immédiate")}
              {row(true, "Tentatives de connexion limitées (10 par 15 min et par adresse) ; actions sensibles tracées")}
            </ul>
          </div>
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-gray-700">Politique</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-800">Double authentification obligatoire</div>
                  <div className="text-xs text-gray-500">Code à 6 chiffres (Google Authenticator, Authy, Microsoft Authenticator) demandé à chaque connexion.</div>
                </div>
                <button onClick={toggle2fa} disabled={busy} role="switch" aria-checked={d.policy.require2fa}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${d.policy.require2fa ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${d.policy.require2fa ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-600 shadow-sm">
              <div className="mb-2 font-semibold text-gray-700">Bonnes pratiques</div>
              <ul className="list-disc space-y-1 pl-5 text-xs">
                <li>Un compte nominatif par personne, jamais de compte partagé.</li>
                <li>Le rôle le plus restreint possible (Rôles et privilèges) : super-administrateur réservé à 1 ou 2 personnes.</li>
                <li>Quand quelqu&apos;un quitte l&apos;équipe : désactivez son compte (déconnexion immédiate).</li>
                <li>Téléchargez une sauvegarde chaque semaine et gardez-la sur un support séparé.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
