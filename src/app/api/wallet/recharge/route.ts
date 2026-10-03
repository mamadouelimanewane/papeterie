import { NextResponse } from "next/server"
import { verifyBearer } from "@/lib/auth"

// La recharge ne doit crediter le portefeuille qu'apres un paiement confirme
// (webhook Versus). Credit direct par le client desactive : il permettait de
// se generer un solde illimite.
export async function POST(req: Request) {
  if (!verifyBearer(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  return NextResponse.json(
    { error: "Recharge indisponible : paiement en ligne requis" },
    { status: 403 }
  )
}
