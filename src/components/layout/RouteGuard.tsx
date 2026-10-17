"use client"

import { signOut, useSession } from "next-auth/react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { hasPerm, permForPath } from "@/lib/permissions"
import { ShieldAlert } from "lucide-react"

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  // Session fermée côté serveur (compte désactivé, déconnexion forcée) : retour à l'écran de connexion
  const revoked = status === "authenticated" && !session?.user
  const needs2fa = !!(session?.user as { needs2fa?: boolean } | undefined)?.needs2fa
  useEffect(() => {
    if (revoked) signOut({ callbackUrl: "/login" })
    else if (needs2fa && pathname !== "/settings/profile") router.replace("/settings/profile")
  }, [revoked, needs2fa, pathname, router])

  if (status === "loading") return <>{children}</>
  if (revoked) return null
  const perms = session?.user?.permissions
  if (perms && !perms.includes("*")) {
    const need = permForPath(pathname)
    if (need && !hasPerm(perms, need)) {
      return (
        <div className="grid min-h-[60vh] place-items-center px-4 text-center">
          <div>
            <ShieldAlert size={48} className="mx-auto text-amber-500" />
            <h2 className="mt-4 text-lg font-bold text-gray-700">Accès non autorisé</h2>
            <p className="mt-1 text-sm text-gray-500">Votre rôle ne vous permet pas d&apos;accéder à cette section.</p>
            <button onClick={() => router.push("/dashboard")} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Retour au tableau de bord</button>
          </div>
        </div>
      )
    }
  }
  return <>{children}</>
}
