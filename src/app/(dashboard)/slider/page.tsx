"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import { useAction } from "@/components/admin/Feedback"
import { fmtDate } from "@/lib/adminApi"
import type { Row } from "@/hooks/useAdminData"

export default function SliderPage() {
  const run = useAction()
  return (
    <CrudPage
      title="Bannières d'accueil" icon="🖼️" itemLabel="une bannière" source="crud/slider" exportName="bannieres"
      description="Bannières du carrousel affiché en haut de l'application et de la boutique. L'ordre suit la séquence."
      columns={[
        { key: "image", label: "Image", render: (r) => r.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={String(r.image)} alt="" className="h-12 w-24 rounded object-cover ring-1 ring-gray-100" />
          : "—", csv: (r) => (String(r.image ?? "").startsWith("data:") ? "(fichier)" : r.image) },
        { key: "title", label: "Titre", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "link", label: "Lien", className: "px-4 py-3 text-xs text-blue-500" },
        { key: "sequence", label: "Séquence" },
        { key: "status", label: "Statut" },
        { key: "createdAt", label: "Créée le", render: (r) => <span className="text-xs text-gray-500">{fmtDate(r.createdAt)}</span> },
      ]}
      rowActions={(r, api) => {
        const sorted = [...api.items].sort((a, b) => Number(a.sequence) - Number(b.sequence))
        const idx = sorted.findIndex((x) => x.id === r.id)
        const swap = (other?: Row) => other && run(async () => {
          await api.update(r.id, { sequence: other.sequence })
          await api.update(other.id, { sequence: r.sequence })
        }, "Ordre mis à jour")
        return (
          <>
            <button onClick={() => swap(sorted[idx - 1])} disabled={idx <= 0} title="Monter" className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30"><ArrowUp size={12} /></button>
            <button onClick={() => swap(sorted[idx + 1])} disabled={idx >= sorted.length - 1} title="Descendre" className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30"><ArrowDown size={12} /></button>
          </>
        )
      }}
      fields={[
        { key: "title", label: "Titre" },
        { key: "link", label: "Lien au clic", placeholder: "/shop/kits" },
        { key: "sequence", label: "Séquence", type: "number", min: 1 },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
        { key: "image", label: "Image", type: "image", required: true },
      ]}
      defaults={{ sequence: 1 }}
    />
  )
}
