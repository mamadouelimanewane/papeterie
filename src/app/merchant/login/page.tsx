"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Store, CheckCircle, AlertCircle, Eye, EyeOff, BookOpen } from "lucide-react"

const mockStores: Record<string, { name: string; email: string; id: number }> = {
  "1": { id: 1, name: "Mon École", email: "contact@monecole.sn" },
}

function generateToken(storeId: number, email: string): string {
  return btoa(`store:${storeId}:${email}:papeterie2024`).replace(/=/g, "")
}

function validateToken(storeId: string, token: string): boolean {
  const store = mockStores[storeId]
  if (!store) return false
  return token === generateToken(store.id, store.email)
}

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const storeId = searchParams.get("store") ?? ""
  const token = searchParams.get("token") ?? ""

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "form">("loading")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  const store = mockStores[storeId]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (storeId && token && validateToken(storeId, token)) {
        setStatus("valid")
        setTimeout(() => setStatus("form"), 1500)
      } else if (storeId || token) {
        setStatus("invalid")
      } else {
        setStatus("form")
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [storeId, token])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) { setError("Mot de passe requis"); return }
    setLoggingIn(true)
    setError("")
    await new Promise(r => setTimeout(r, 1500))
    if (password.length >= 4) {
      router.push(`/merchant/dashboard?store=${storeId || "1"}`)
    } else {
      setError("Mot de passe incorrect")
      setLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">PAPETERIE</h1>
          <p className="text-gray-500 text-sm mt-1">Espace Marchand — Mon École</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {status === "loading" && (
            <div className="p-8 text-center">
              <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Vérification du lien...</p>
              <p className="text-gray-400 text-sm mt-1">Patientez quelques instants</p>
            </div>
          )}

          {status === "valid" && store && (
            <div className="p-8 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Lien valide ✓</h2>
              <p className="text-gray-500 text-sm">Connexion à <span className="font-medium text-gray-700">{store.name}</span></p>
              <div className="mt-4 flex justify-center">
                <Loader2 size={20} className="text-indigo-500 animate-spin" />
              </div>
            </div>
          )}

          {status === "invalid" && (
            <div className="p-8 text-center">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Lien invalide</h2>
              <p className="text-gray-500 text-sm">Ce lien de connexion est expiré ou incorrect.</p>
              <p className="text-gray-400 text-xs mt-2">Demandez un nouveau lien à l&apos;administrateur.</p>
              <button
                onClick={() => setStatus("form")}
                className="mt-6 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Se connecter manuellement
              </button>
            </div>
          )}

          {status === "form" && (
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-gray-800">
                  {store ? `Connexion — ${store.name}` : "Connexion Marchand"}
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {store ? store.email : "Entrez vos identifiants"}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email</label>
                <input
                  type="email"
                  defaultValue={store?.email ?? ""}
                  readOnly={!!store}
                  className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${store ? "bg-gray-50 text-gray-500" : ""}`}
                  placeholder="email@boutique.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loggingIn ? (
                  <><Loader2 size={16} className="animate-spin" />Connexion...</>
                ) : "Se connecter"}
              </button>

              <p className="text-center text-xs text-gray-400 mt-2">
                Mot de passe oublié ?{" "}
                <span className="text-indigo-500 cursor-pointer hover:underline">Contacter l&apos;admin</span>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 PAPETERIE · Plateforme multi-boutiques en ligne
        </p>
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
