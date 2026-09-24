"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import TransactionsReport from "@/components/admin/TransactionsReport"
import FormModal from "@/components/admin/FormModal"
import { useAction } from "@/components/admin/Feedback"
import { loadAccounts, type Party } from "@/hooks/useAdminData"
import { adminFetch } from "@/lib/adminApi"

const PARTIES = [{ value: "user", label: "Client" }, { value: "driver", label: "Livreur" }, { value: "store", label: "Boutique" }]
const METHODS = ["Espèces", "Wave", "Orange Money", "Virement", "Geste commercial", "Correction"]

export default function WalletPage() {
  const [open, setOpen] = useState(false)
  const [party, setParty] = useState<Party>("user")
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([])
  const [key, setKey] = useState(0)
  const run = useAction()

  const pick = async (p: Party) => {
    setParty(p)
    const list = await run(() => loadAccounts(p))
    setAccounts(list ?? [])
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={async () => { await pick(party); setOpen(true) }}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={14} /> Créditer / débiter un portefeuille
        </button>
      </div>
      <TransactionsReport key={key} title="Portefeuilles — mouvements" icon="💰" />

      <FormModal
        open={open} title="Mouvement de portefeuille" submitLabel="Valider"
        initial={{ party, direction: "Crédit", method: METHODS[0] }}
        fields={[
          { key: "party", label: "Type de compte", type: "select", options: PARTIES, required: true },
          { key: "id", label: "Compte", type: "select", options: accounts, required: true },
          { key: "direction", label: "Sens", type: "select", required: true, options: [{ value: "Crédit", label: "Créditer (+)" }, { value: "Débit", label: "Débiter (−)" }] },
          { key: "amount", label: "Montant (FCFA)", type: "number", min: 1, required: true },
          { key: "method", label: "Méthode", type: "select", options: METHODS, required: true },
          { key: "description", label: "Motif", placeholder: "Recharge, remboursement commande #…, bonus…", full: true },
        ]}
        onClose={() => setOpen(false)}
        onValuesChange={(v, k) => { if (k === "party") pick(v.party as Party) }}
        onSubmit={async (v) => {
          const r = await run(() => adminFetch<{ balance: number }>("/api/admin/wallet", { method: "POST", body: v }))
          if (r) { setOpen(false); setKey((k) => k + 1) }
        }}
      />
    </div>
  )
}
