"use client"

import { useEffect, useState } from "react"
import { adminFetch, fmtDate } from "@/lib/adminApi"

export type InviteView = { userId: string; name: string; phone: string; link: string; createdAt: string; expiresAt: string; openedAt: string | null; installedAt: string | null }

function Qr({ url }: { url: string }) {
  const [src, setSrc] = useState("")
  useEffect(() => {
    let off = false
    import("qrcode").then((m) => m.toDataURL(url, { width: 240, margin: 1 })).then((d) => { if (!off) setSrc(d) }).catch(() => {})
    return () => { off = true }
  }, [url])
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="Code QR" width={150} height={150} className="mx-auto rounded-lg ring-1 ring-gray-200" /> : <div className="mx-auto h-[150px] w-[150px] rounded-lg bg-gray-100" />
}

const message = (link: string, firstName?: string) =>
  `${firstName ? `Bonjour ${firstName}, ` : "Bonjour, "}installez l'application Schoolmatik pour commander les livres et fournitures scolaires, livrés à Dakar : ${link}`

/**
 * Lien installable de l'application client.
 * - `user` absent : lien universel (/app), à diffuser à tous les parents ;
 * - `user` présent : lien personnel du client (/i/<code>), qui pré-remplit son nom et son téléphone.
 */
export default function InviteLinkModal({ user, onClose }: { user?: { id: string; name: string }; onClose: () => void }) {
  const [invite, setInvite] = useState<InviteView | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState("")
  const [origin, setOrigin] = useState("")

  const load = async (renew = false) => {
    if (!user) return
    setBusy(true); setError("")
    try {
      const r = await adminFetch<{ invites: InviteView[] }>("/api/admin/client-invites", { method: "POST", body: { userIds: [user.id], renew } })
      setInvite(r.invites[0] ?? null)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") } finally { setBusy(false) }
  }
  useEffect(() => {
     
    setOrigin(window.location.origin)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const link = user ? invite?.link ?? "" : origin ? `${origin}/app` : ""
  const firstName = user?.name.split(/\s+/)[0]
  const text = link ? message(link, firstName) : ""
  const wa = link ? `https://wa.me/${user && invite?.phone ? "221" + invite.phone : ""}?text=${encodeURIComponent(text)}` : ""
  const copy = async (value: string, key: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(""), 1800) } catch { window.prompt("Copiez :", value) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold text-gray-800">{user ? `Lien d'invitation — ${user.name}` : "Lien d'installation de l'application"}</h2>
          <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-xs text-gray-500">
            {user
              ? "Lien personnel : il installe l'application et pré-remplit le nom et le téléphone du client. Il ne donne pas accès à son compte."
              : "Un seul lien pour tous les parents : il ouvre la page d'installation de l'application (Android et iPhone), puis la boutique."}
          </p>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {link ? (
            <>
              <Qr url={link} />
              <code className="block break-all rounded bg-gray-100 px-2 py-1.5 text-center text-xs text-gray-700">{link}</code>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => copy(link, "link")} className="rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">{copied === "link" ? "Copié ✓" : "Copier le lien"}</button>
                <button onClick={() => copy(text, "msg")} className="rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">{copied === "msg" ? "Copié ✓" : "Copier le message"}</button>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-500 py-2 text-center text-sm font-medium text-white hover:bg-green-600">WhatsApp</a>
              </div>
              {user && invite && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-gray-50 p-2"><div className="text-gray-400">Créé</div><div className="font-medium text-gray-700">{fmtDate(invite.createdAt)}</div></div>
                  <div className="rounded-lg bg-gray-50 p-2"><div className="text-gray-400">Ouvert</div><div className="font-medium text-gray-700">{invite.openedAt ? fmtDate(invite.openedAt) : "—"}</div></div>
                  <div className="rounded-lg bg-gray-50 p-2"><div className="text-gray-400">Installé</div><div className="font-medium text-gray-700">{invite.installedAt ? fmtDate(invite.installedAt) : "—"}</div></div>
                </div>
              )}
              {user && invite && !invite.phone && <p className="text-xs text-amber-600">Ce client n&apos;a pas de numéro valide : le message WhatsApp devra être envoyé manuellement.</p>}
            </>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">{busy ? "Création du lien..." : ""}</div>
          )}
        </div>
        <div className="flex justify-between gap-2 border-t p-4">
          {user ? (
            <button onClick={() => load(true)} disabled={busy} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50" title="L'ancien lien cessera de fonctionner">Nouveau lien</button>
          ) : <span />}
          <button onClick={onClose} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">Fermer</button>
        </div>
      </div>
    </div>
  )
}
