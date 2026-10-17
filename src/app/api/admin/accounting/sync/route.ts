import { NextRequest, NextResponse } from "next/server"
import { accAuth, accError } from "@/lib/accounting/api"
import { syncAccounting } from "@/lib/accounting/sync"

export const runtime = "nodejs"
export const maxDuration = 60

/** POST : comptabilise toutes les opérations pas encore passées (ventes, encaissements, livreurs, retraits, remboursements). */
export async function POST(req: NextRequest) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const r = await syncAccounting()
    return NextResponse.json({ created: r.created, byType: r.byType, errors: r.errors, manual: r.manual })
  } catch (e) { return accError(e) }
}
