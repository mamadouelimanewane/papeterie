import { cn } from "@/lib/utils"

/** Libellés français des statuts stockés en base (en anglais). */
const LABELS: Record<string, string> = {
  active: "Actif", inactive: "Inactif", online: "En ligne", offline: "Hors ligne", busy: "En livraison",
  pending: "En attente", approved: "Approuvé", rejected: "Rejeté", completed: "Terminé", processing: "En cours",
  delivered: "Livrée", cancelled: "Annulée", expiring: "Expire bientôt", draft: "Brouillon", sent: "Envoyée",
  paid: "Payé", refunded: "Remboursé", blocked: "Bloqué",
}

export default function StatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase()
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        ["active", "online", "approved", "completed", "delivered", "paid", "payé", "envoyée"].includes(s)
          ? "bg-green-100 text-green-700"
          : ["inactive", "rejected", "cancelled", "blocked"].includes(s)
          ? "bg-red-100 text-red-700"
          : ["pending", "en attente", "expiring", "brouillon", "draft"].includes(s)
          ? "bg-yellow-100 text-yellow-700"
          : s === "offline"
          ? "bg-gray-100 text-gray-600"
          : ["processing", "busy", "sent"].includes(s)
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-100 text-gray-600"
      )}
    >
      {LABELS[s] ?? status}
    </span>
  )
}
