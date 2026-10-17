"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("") // pas d'adresse pré-remplie : elle révélerait le compte super-admin
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState<string | null>(null) // null : pas de double authentification demandée
  const [forgot, setForgot] = useState<string | null>(null) // null : formulaire « oublié » fermé
  const [forgotMsg, setForgotMsg] = useState("")

  async function requestReset() {
    setLoading(true)
    const r = await fetch("/api/admin-reset/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgot }) })
    const d = await r.json().catch(() => ({}))
    setLoading(false)
    if (!r.ok) return setForgotMsg(d.error ?? "Erreur, réessayez.")
    setForgotMsg(d.mailConfigured
      ? "Si un compte existe pour cette adresse, un lien valable 1 heure vient d'être envoyé. Pensez à vérifier les courriers indésirables."
      : "L'envoi d'e-mails n'est pas encore configuré sur le site : demandez au super-administrateur de réinitialiser votre mot de passe (Paramètres › Administrateurs).")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      ...(otp !== null ? { otp } : {}),
      redirect: false,
    })

    setLoading(false)
    if (result?.error === "2FA_REQUIRED") {
      setOtp("")
      setError("")
    } else if (result?.error === "2FA_INVALID") {
      setOtp("")
      setError("Code de vérification incorrect ou expiré.")
    } else if (result?.error) {
      setError("Ces identifiants ne correspondent à aucun compte.")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-sun-400"
    >
      {/* Formes de la charte Schoolmatik : disque jaune clair et bandeau rouge (comme les flyers) */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sun-300" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full border-[28px] border-brand-600/10" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-brand-600" />
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/schoolmatik-logo-256.png" alt="Schoolmatik Solutions" className="h-24 w-24 rounded-2xl object-contain shadow-md ring-1 ring-black/5" />
          </div>

          <h2 className="text-center text-xl font-extrabold text-brand-700 mb-1">Espace Administration</h2>
          <p className="text-center text-gray-500 text-xs mb-5">Schoolmatik Librairie · Fournitures &amp; livres scolaires</p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded-lg text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-2 text-white/80 hover:text-white">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* text-base sur mobile : 16px évite le zoom automatique du navigateur */}
            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-base sm:text-sm text-gray-900 bg-gray-50"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-base sm:text-sm text-gray-900 bg-gray-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 hover:text-brand-700"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {otp !== null && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Code de vérification (application d&apos;authentification)</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-center text-lg tracking-[0.4em] text-gray-900 bg-gray-50"
                  required
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors disabled:opacity-60 text-sm shadow-md shadow-brand-600/20"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          {/* Mot de passe oublié : lien de réinitialisation par e-mail */}
          {forgot === null ? (
            <button type="button" onClick={() => { setForgot(""); setError("") }} className="mt-4 block w-full text-center text-xs text-gray-500 hover:text-brand-700">
              Mot de passe oublié ?
            </button>
          ) : (
            <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
              {forgotMsg ? (
                <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{forgotMsg}</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500">Saisissez l&apos;adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
                  <input type="email" placeholder="Adresse e-mail" value={forgot} onChange={(e) => setForgot(e.target.value)} autoCapitalize="none" inputMode="email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-base sm:text-sm text-gray-900 bg-gray-50" />
                  <button type="button" disabled={loading || !forgot.includes("@")} onClick={requestReset}
                    className="w-full rounded-lg border border-brand-600 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">
                    Recevoir le lien
                  </button>
                </>
              )}
              <button type="button" onClick={() => { setForgot(null); setForgotMsg("") }} className="block w-full text-center text-xs text-gray-500 hover:text-brand-700">Retour</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-800 text-xs font-medium mt-6">
          © 2026 Schoolmatik Librairie · Fournitures scolaires · Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
