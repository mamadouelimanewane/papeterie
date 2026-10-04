"use client"

import { useState } from "react"
import { useSetting } from "@/hooks/useAdminData"
import { useAction } from "@/components/admin/Feedback"
import { Save, Send, Bell, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react"

type Segment = "All" | "Subscribed Users" | "Active Users" | "Inactive Users"

export default function PushNotificationPage() {
  // Clés et types enregistrés côté serveur (la REST API Key n'est jamais réaffichée)
  const push = useSetting("push", {
    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "",
    restApiKey: "",
    userNotif: true, driverNotif: true, storeNotif: true, orderNotif: true, promoNotif: false,
  })
  const run = useAction()
  const appId = String(push.value.appId ?? "")
  const restApiKey = String(push.value.restApiKey ?? "")
  const setAppId = (v: string) => push.set("appId", v)
  const setRestApiKey = (v: string) => push.set("restApiKey", v)
  const [showKey, setShowKey] = useState(false)

  const enabledTypes = {
    userNotif: Boolean(push.value.userNotif), driverNotif: Boolean(push.value.driverNotif), storeNotif: Boolean(push.value.storeNotif),
    orderNotif: Boolean(push.value.orderNotif), promoNotif: Boolean(push.value.promoNotif),
  }

  const [sendTitle, setSendTitle] = useState("")
  const [sendMessage, setSendMessage] = useState("")
  const [sendSegment, setSendSegment] = useState<Segment>("All")
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [subStatus, setSubStatus] = useState<"idle" | "subscribed" | "unsubscribed" | "loading">("idle")

  const toggleType = (key: keyof typeof enabledTypes) => {
    const next = { ...push.value, [key]: !enabledTypes[key] }
    push.setValue(next)
    run(() => push.save(next), "Préférence enregistrée")
  }

  const handleSubscribe = async () => {
    setSubStatus("loading")
    try {
      const { subscribeUser } = await import("@/lib/onesignal")
      await subscribeUser()
      setSubStatus("subscribed")
    } catch {
      setSubStatus("unsubscribed")
    }
  }

  const handleUnsubscribe = async () => {
    setSubStatus("loading")
    try {
      const { unsubscribeUser } = await import("@/lib/onesignal")
      await unsubscribeUser()
      setSubStatus("unsubscribed")
    } catch {
      setSubStatus("idle")
    }
  }

  const handleSend = async () => {
    if (!sendTitle || !sendMessage) {
      setSendResult({ ok: false, msg: "Titre et message requis" })
      return
    }
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sendTitle, message: sendMessage, segments: [sendSegment] }),
      })
      const data = await res.json()
      if (res.ok) {
        setSendResult({ ok: true, msg: `Envoyé à ${data.recipients ?? "?"} destinataire(s) — ID: ${data.id}` })
      } else {
        setSendResult({ ok: false, msg: data.error ?? "Erreur lors de l'envoi" })
      }
    } catch {
      setSendResult({ ok: false, msg: "Impossible de joindre le serveur" })
    } finally {
      setSending(false)
    }
  }

  const Toggle = ({ val, onToggle }: { val: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${val ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${val ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
        <Bell size={18} className="text-orange-500" /> Push Notifications — OneSignal
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Credentials */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">🔑 Credentials OneSignal</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">App ID</label>
              <input
                value={appId}
                onChange={e => setAppId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                REST API Key <span className="text-red-400 font-normal">— serveur uniquement</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={restApiKey}
                  onChange={e => setRestApiKey(e.target.value)}
                  placeholder="os_v2_app_..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button onClick={() => setShowKey(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-700">Ajouter dans <code className="bg-gray-100 px-1 rounded">.env.local</code> :</p>
              <code className="block bg-gray-100 rounded px-2 py-1">NEXT_PUBLIC_ONESIGNAL_APP_ID=votre-app-id</code>
              <code className="block bg-gray-100 rounded px-2 py-1">ONESIGNAL_APP_ID=votre-app-id</code>
              <code className="block bg-gray-100 rounded px-2 py-1">ONESIGNAL_REST_API_KEY=votre-rest-api-key</code>
              <p className="text-gray-400">Trouver ces clés : <span className="text-blue-500">app.onesignal.com → Settings → Keys &amp; IDs</span></p>
            </div>

            <button onClick={() => run(() => push.save(), "Clés OneSignal enregistrées")} disabled={push.saving} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg w-full justify-center disabled:opacity-60">
              <Save size={14} /> {push.saving ? "Enregistrement…" : "Enregistrer les clés"}
            </button>
          </div>
        </div>

        {/* Types + abonnement */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">🔔 Types de notifications</h2>
          <div className="space-y-0">
            {([
              { key: "userNotif" as const, label: "Notifications utilisateurs", desc: "Nouvelles commandes, statuts" },
              { key: "driverNotif" as const, label: "Notifications livreurs", desc: "Nouvelles missions, alertes" },
              { key: "storeNotif" as const, label: "Notifications commerces", desc: "Commandes reçues, paiements" },
              { key: "orderNotif" as const, label: "Notifications de commandes", desc: "Mises à jour de statut" },
              { key: "promoNotif" as const, label: "Notifications promotionnelles", desc: "Offres, codes promo" },
            ]).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <Toggle val={enabledTypes[key]} onToggle={() => toggleType(key)} />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">Abonnement de ce navigateur (test) :</p>
            <div className="flex gap-2">
              <button onClick={handleSubscribe} disabled={subStatus === "loading"}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs rounded-lg font-medium">
                {subStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                S&apos;abonner
              </button>
              <button onClick={handleUnsubscribe} disabled={subStatus === "loading"}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg font-medium">
                Se désabonner
              </button>
            </div>
            {subStatus === "subscribed" && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={12} /> Navigateur abonné</p>
            )}
            {subStatus === "unsubscribed" && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><XCircle size={12} /> Navigateur désabonné</p>
            )}
          </div>
        </div>
      </div>

      {/* Envoi de notification */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Send size={15} className="text-blue-500" /> Envoyer une notification
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Titre</label>
            <input value={sendTitle} onChange={e => setSendTitle(e.target.value)}
              placeholder="Ex: Nouvelle livraison disponible"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Segment cible</label>
            <select value={sendSegment} onChange={e => setSendSegment(e.target.value as Segment)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="All">Tous les abonnés</option>
              <option value="Subscribed Users">Utilisateurs abonnés</option>
              <option value="Active Users">Utilisateurs actifs</option>
              <option value="Inactive Users">Utilisateurs inactifs</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
            <textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)} rows={3}
              placeholder="Ex: Une nouvelle commande vous attend dans votre zone."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={handleSend} disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg shadow-sm">
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sending ? "Envoi en cours..." : "Envoyer"}
          </button>
          {sendResult && (
            <div className={`flex items-center gap-2 text-sm font-medium ${sendResult.ok ? "text-green-600" : "text-red-500"}`}>
              {sendResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {sendResult.msg}
            </div>
          )}
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
          <strong>Note :</strong> L&apos;envoi réel nécessite <code className="bg-amber-100 px-1 rounded">ONESIGNAL_APP_ID</code> et{" "}
          <code className="bg-amber-100 px-1 rounded">ONESIGNAL_REST_API_KEY</code> dans <code className="bg-amber-100 px-1 rounded">.env.local</code>.
        </div>
      </div>
    </div>
  )
}
