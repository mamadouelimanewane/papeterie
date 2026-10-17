"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type State = { enabled: boolean; secret?: string; qr?: string }

/** Double authentification de mon compte : activation par QR code + premier code, désactivation par code. */
export default function TwoFactorCard({ required }: { required?: boolean }) {
  const [s, setS] = useState<State | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [setup, setSetup] = useState(false)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const { toast } = useFeedback()

  const load = useCallback((prepare: boolean) => {
    // GET prépare un nouveau secret quand la 2FA est inactive : appelé seulement à la demande
    if (!prepare) { adminFetch<State>("/api/admin/2fa").then((r) => setS(r.enabled ? r : { enabled: false })).catch((e) => setErr(e instanceof Error ? e.message : "Erreur")); return }
    adminFetch<State>("/api/admin/2fa").then((r) => { setS(r); setSetup(!r.enabled) }).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
  }, [toast])
  useEffect(() => { load(false) }, [load])

  const enable = async () => {
    setBusy(true)
    try { await adminFetch("/api/admin/2fa", { method: "POST", body: { code } }); toast("Double authentification activée"); setSetup(false); setCode(""); setS({ enabled: true }) } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy(false) }
  }
  const disable = async () => {
    const c = window.prompt("Code actuel de votre application d'authentification :")
    if (!c) return
    try { await adminFetch("/api/admin/2fa", { method: "DELETE", body: { code: c } }); toast("Double authentification désactivée"); setS({ enabled: false }) } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${required && !s?.enabled ? "border-amber-300" : "border-gray-100"}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><ShieldCheck size={16} /> Double authentification</div>
      {err ? <p className="text-xs text-gray-500">{err}</p> : !s ? <div className="h-10 animate-pulse rounded bg-gray-50" /> : s.enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-emerald-700">✓ Activée : un code à 6 chiffres vous est demandé à chaque connexion.</p>
          {!required && <button onClick={disable} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">Désactiver</button>}
        </div>
      ) : !setup ? (
        <div className="space-y-2">
          {required && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">La double authentification est obligatoire : activez-la pour accéder au back-office.</p>}
          <p className="text-sm text-gray-600">Protège votre compte même si votre mot de passe est découvert. Il faut une application gratuite sur votre téléphone : Google Authenticator, Microsoft Authenticator ou Authy.</p>
          <button onClick={() => load(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Activer</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {s.qr && <img src={s.qr} alt="QR code à scanner" className="h-44 w-44 rounded-lg border border-gray-100" />}
          <div className="space-y-2 text-sm text-gray-600">
            <ol className="list-decimal space-y-1 pl-4 text-xs">
              <li>Ouvrez l&apos;application d&apos;authentification et scannez ce QR code.</li>
              <li>Sans appareil photo : saisissez la clé <code className="break-all rounded bg-gray-100 px-1" data-no-i18n>{s.secret}</code></li>
              <li>Tapez le code à 6 chiffres affiché pour confirmer.</li>
            </ol>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-center tracking-widest" />
              <button onClick={enable} disabled={busy || code.length !== 6} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
