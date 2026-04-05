"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@papeterie.sn")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError("Ces identifiants ne correspondent à aucun compte.")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        background: "linear-gradient(135deg, #4A148C 0%, #6A1B9A 50%, #7B1FA2 100%)",
      }}
    >
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center border border-purple-100">
              <div className="text-center">
                <div className="text-purple-600 text-2xl">📚</div>
                <div className="text-purple-700 font-bold text-[10px] mt-1 uppercase tracking-wider">PAPETERIE</div>
              </div>
            </div>
          </div>

          <h2 className="text-center text-gray-700 font-semibold mb-1">Espace Administration</h2>
          <p className="text-center text-gray-400 text-xs mb-5">Plateforme de Fournitures Scolaires Papeterie</p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded-lg text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-2 text-white/80 hover:text-white">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 text-sm shadow-lg shadow-purple-200"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/70 text-xs mt-6">
          © 2026 Papeterie · Plateforme de Fournitures Scolaires · Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
