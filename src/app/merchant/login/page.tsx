"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2, AlertCircle, Eye, EyeOff, BookOpen, KeyRound } from "lucide-react"

const MIN_PASSWORD_LENGTH = 8

type Invite = { name: string; email: string; expiresAt: string }

function PasswordInput({ value, onChange, autoComplete, placeholder }: {
  value: string; onChange: (v: string) => void; autoComplete: string; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder={placeholder ?? "••••••••"}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
      <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
      <p className="text-xs text-red-600">{message}</p>
    </div>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [inviteToken] = useState(() => searchParams.get("invite") ?? "")

  const [mode, setMode] = useState<"checking" | "invite" | "invalid" | "login">(inviteToken ? "checking" : "login")
  const [invite, setInvite] = useState<Invite | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!inviteToken) return
    // Le jeton ne reste pas dans la barre d'adresse (historique, captures d'écran, en-tête Referer)
    window.history.replaceState(null, "", "/merchant/login")
    fetch(`/api/merchant/invite?token=${encodeURIComponent(inviteToken)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error()
        const data: Invite = await r.json()
        setInvite(data)
        setMode("invite")
      })
      .catch(() => setMode("invalid"))
  }, [inviteToken])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError("E-mail et mot de passe requis"); return }
    setLoading(true)
    setError("")
    const res = await signIn("merchant", { email, password, redirect: false })
    if (res?.error) {
      setError("E-mail ou mot de passe incorrect (ou accès non encore activé).")
      setLoading(false)
    } else {
      router.replace("/merchant/dashboard")
    }
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) { setError(`Au moins ${MIN_PASSWORD_LENGTH} caractères`); return }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas"); return }
    setLoading(true)
    setError("")
    const res = await signIn("merchant-invite", { token: inviteToken, password, redirect: false })
    if (res?.error) {
      setError("Ce lien n'est plus valable (déjà utilisé ou expiré). Demandez-en un nouveau à l'administrateur.")
      setLoading(false)
    } else {
      router.replace("/merchant/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">SCHOOLMATIK</h1>
          <p className="text-gray-500 text-sm mt-1">Espace marchand</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {mode === "checking" && (
            <div className="p-8 text-center">
              <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Vérification du lien…</p>
            </div>
          )}

          {mode === "invalid" && (
            <div className="p-8 text-center">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Lien invalide</h2>
              <p className="text-gray-500 text-sm">Ce lien d&apos;invitation est expiré, déjà utilisé ou incorrect.</p>
              <p className="text-gray-400 text-xs mt-2">Demandez un nouveau lien à l&apos;administrateur.</p>
              <button
                onClick={() => setMode("login")}
                className="mt-6 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                J&apos;ai déjà un mot de passe
              </button>
            </div>
          )}

          {mode === "invite" && invite && (
            <form onSubmit={handleActivate} className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <KeyRound size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Activer l&apos;accès — {invite.name}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Choisissez votre mot de passe. Vous vous connecterez ensuite avec l&apos;e-mail <b>{invite.email}</b>.
                  </p>
                </div>
              </div>
              <input type="email" value={invite.email} autoComplete="username" readOnly hidden />
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nouveau mot de passe</label>
                <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder={`${MIN_PASSWORD_LENGTH} caractères minimum`} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Confirmer le mot de passe</label>
                <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
              </div>
              {error && <ErrorBox message={error} />}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />Activation…</> : "Activer et se connecter"}
              </button>
            </form>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Connexion marchand</h2>
                <p className="text-gray-500 text-xs mt-0.5">E-mail de la boutique et mot de passe</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="contact@boutique.sn"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Mot de passe</label>
                <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
              </div>
              {error && <ErrorBox message={error} />}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />Connexion…</> : "Se connecter"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Première connexion ou mot de passe oublié ? Demandez un lien d&apos;invitation à l&apos;administrateur.
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 Schoolmatik</p>
      </div>
    </div>
  )
}

export default function MerchantLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
