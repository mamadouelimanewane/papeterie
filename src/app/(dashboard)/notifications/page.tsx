"use client"

import { Bell, Send } from "lucide-react"
import CrudPage from "@/components/admin/CrudPage"
import StatusBadge from "@/components/ui/StatusBadge"
import { useFeedback, useAction } from "@/components/admin/Feedback"
import { adminFetch, fmtDate } from "@/lib/adminApi"

const TARGETS = [
  { value: "All", label: "Tous les utilisateurs" },
  { value: "Users", label: "Clients uniquement" },
  { value: "Drivers", label: "Livreurs uniquement" },
]
const targetLabel = (v: unknown) => TARGETS.find((t) => t.value === v)?.label ?? String(v ?? "—")

export default function NotificationsPage() {
  const { confirm, toast } = useFeedback()
  const run = useAction()
  return (
    <CrudPage
      title="Notifications promotionnelles" icon={<Bell size={18} />} itemLabel="une notification" source="crud/notifications" exportName="notifications"
      description="Créez un brouillon, puis envoyez-le en notification push (OneSignal) aux applications."
      statusKey={null}
      columns={[
        { key: "title", label: "Titre", className: "px-4 py-3 font-semibold text-gray-800" },
        { key: "message", label: "Message", className: "max-w-xs truncate px-4 py-3 text-sm text-gray-600" },
        { key: "target", label: "Cible", render: (r) => <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{targetLabel(r.target)}</span>, csv: (r) => targetLabel(r.target) },
        { key: "status", label: "Statut", render: (r) => <StatusBadge status={r.status === "Sent" ? "Envoyée" : "Brouillon"} />, csv: (r) => (r.status === "Sent" ? "Envoyée" : "Brouillon") },
        { key: "sentAt", label: "Envoyée le", render: (r) => <span className="text-xs text-gray-500">{fmtDate(r.sentAt)}</span>, csv: (r) => fmtDate(r.sentAt) },
      ]}
      rowActions={(r, api) => (
        <button title={r.status === "Sent" ? "Renvoyer" : "Envoyer"}
          onClick={async () => {
            if (!(await confirm({ title: `${r.status === "Sent" ? "Renvoyer" : "Envoyer"} « ${String(r.title)} » ?`, message: `Destinataires : ${targetLabel(r.target)}.`, confirmLabel: "Envoyer" }))) return
            const res = await run(() => adminFetch<{ recipients: number; onesignalConfigured: boolean }>("/api/notifications/send", {
              method: "POST", body: { notificationId: r.id, title: r.title, message: r.message, imageUrl: r.imageUrl, segments: [String(r.target ?? "All")] },
            }))
            if (res) {
              api.reload()
              toast(res.onesignalConfigured ? `Notification envoyée (${res.recipients} destinataires)` : "Enregistrée comme envoyée — OneSignal n'est pas configuré, aucun push réel", res.onesignalConfigured ? "success" : "info")
            }
          }}
          className="rounded bg-indigo-500 p-1.5 text-white hover:bg-indigo-600"><Send size={12} /></button>
      )}
      fields={[
        { key: "title", label: "Titre", required: true, full: true, placeholder: "Rentrée 2026 : -15 % sur les kits" },
        { key: "message", label: "Message", type: "textarea", required: true },
        { key: "target", label: "Cible", type: "select", options: TARGETS, required: true },
        { key: "imageUrl", label: "Image (facultatif)", type: "image" },
      ]}
      defaults={{ target: "All", status: "Draft" }}
      fromForm={(v) => ({ ...v, status: v.status ?? "Draft" })}
    />
  )
}
