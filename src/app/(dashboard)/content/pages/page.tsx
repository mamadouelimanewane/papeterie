"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import { fmtDate } from "@/lib/adminApi"

const SEED = [
  { title: "À propos", slug: "about", type: "Page", content: "Schoolmatik Librairie livre fournitures et livres scolaires à Dakar.", status: "Active" },
  { title: "Conditions d'utilisation", slug: "terms", type: "Page", content: "", status: "Active" },
  { title: "Politique de confidentialité", slug: "privacy", type: "Page", content: "", status: "Active" },
  { title: "Comment ça marche", slug: "how-it-works", type: "Page", content: "", status: "Active" },
]

const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export default function ContentPagesPage() {
  return (
    <CrudPage
      title="Pages de contenu" icon="📋" itemLabel="une page" source="records/pages" seed={SEED} exportName="pages-contenu"
      columns={[
        { key: "title", label: "Titre", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "slug", label: "Slug", render: (r) => <span className="font-mono text-xs text-gray-600">/{String(r.slug ?? "")}</span> },
        { key: "type", label: "Type" },
        { key: "createdAt", label: "Créée le", render: (r) => <span className="text-xs text-gray-500">{fmtDate(r.createdAt)}</span> },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "title", label: "Titre", required: true },
        { key: "slug", label: "Slug (URL)", placeholder: "généré depuis le titre si vide" },
        { key: "type", label: "Type", type: "select", options: ["Page", "Popup", "Bannière"] },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
        { key: "content", label: "Contenu", type: "textarea" },
      ]}
      defaults={{ type: "Page" }}
      fromForm={(v) => ({ ...v, slug: v.slug ? slugify(String(v.slug)) : slugify(String(v.title ?? "")) })}
    />
  )
}
