"use client"

import { useState } from "react"
import { Plug } from "lucide-react"
import SettingsPage from "@/components/admin/SettingsPage"
import { useFeedback } from "@/components/admin/Feedback"
import { adminFetch } from "@/lib/adminApi"

const DEFAULTS = {
  driver: "smtp", host: "smtp.gmail.com", port: 587, username: "", password: "", encryption: "TLS",
  fromName: "Schoolmatik Librairie", fromEmail: "contact@schoolmatik.sn",
}

export default function EmailConfigPage() {
  const { toast } = useFeedback()
  const [testing, setTesting] = useState(false)
  return (
    <SettingsPage
      settingKey="email" title="Configuration e-mail" defaults={DEFAULTS} columns={1}
      description="Le mot de passe est stocké côté serveur et n'est jamais réaffiché."
      sections={[{ title: "Paramètres SMTP", fields: [
        { key: "driver", label: "Service d'envoi", type: "select", required: true, options: [
          { value: "smtp", label: "SMTP" }, { value: "sendgrid", label: "SendGrid" }, { value: "mailgun", label: "Mailgun" }, { value: "ses", label: "Amazon SES" },
        ] },
        { key: "host", label: "Hôte SMTP", placeholder: "smtp.example.com" },
        { key: "port", label: "Port", type: "number", min: 1 },
        { key: "encryption", label: "Chiffrement", type: "select", required: true, options: ["TLS", "SSL", "None"] },
        { key: "username", label: "Nom d'utilisateur", placeholder: "user@example.com" },
        { key: "password", label: "Mot de passe", type: "password" },
        { key: "fromName", label: "Nom de l'expéditeur" },
        { key: "fromEmail", label: "E-mail de l'expéditeur", type: "email" },
      ] }]}
      extraActions={(v) => (
        <button type="button" disabled={testing}
          onClick={async () => {
            setTesting(true)
            try {
              const r = await adminFetch<{ ok: boolean; message: string }>("/api/admin/tools/smtp-test", { method: "POST", body: { host: v.host, port: v.port, encryption: v.encryption } })
              toast(r.ok ? `Serveur joignable : ${r.message}` : `Échec : ${r.message}`, r.ok ? "success" : "error")
            } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setTesting(false) }
          }}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60">
          <Plug size={14} /> {testing ? "Test en cours…" : "Tester la connexion"}
        </button>
      )}
    />
  )
}
